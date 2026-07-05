import express from "express";
import serverless from "serverless-http";

const app = express();
const router = express.Router();

app.use(express.json());

// Caches 
const CACHE_EXPIRY = 15 * 60 * 1000;
const animeCache = new Map<string, { data: any[], timestamp: number }>();
const mangaCache = new Map<string, { data: any[], timestamp: number }>();
const profileCache = new Map<string, { data: any, timestamp: number }>();

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "application/json, text/javascript, */*; q=0.01",
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});


const ALLOWED_IMAGE_HOSTS = new Set([
  "cdn.myanimelist.net",
  "s4.anilist.co",
  "img.anili.st",
]);

router.get("/image-proxy", async (req, res) => {
  const imageUrl = typeof req.query.url === "string" ? req.query.url : "";
  if (!imageUrl) { res.status(400).json({ error: "Missing url parameter" }); return; }

  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    res.status(400).json({ error: "Invalid url parameter" });
    return;
  }

  if (parsed.protocol !== "https:" || !ALLOWED_IMAGE_HOSTS.has(parsed.hostname)) {
    res.status(400).json({ error: "Host not allowed" });
    return;
  }

  try {
    const upstream = await fetch(parsed.toString(), { headers: HEADERS });
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Upstream returned ${upstream.status}` });
      return;
    }
    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await upstream.arrayBuffer());

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(buffer);
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch image" });
  }
});

// AniList User Profile
router.get("/user/anilist/:username", async (req, res) => {
  const username = req.params.username?.trim();
  if (!username) { res.status(400).json({ error: "Username is required" }); return; }

  try {
    const query = `
      query ($userName: String) {
        User(name: $userName) {
          id name avatar { large } createdAt
        }
      }
    `;
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query, variables: { userName: username } })
    });

    if (!response.ok) throw new Error(`AniList API returned ${response.status}`);
    const body = await response.json();
    if (body.errors) throw new Error(body.errors[0]?.message || "User not found");

    const user = body.data.User;
    res.json({
      username: user.name,
      url: `https://anilist.co/user/${user.name}`,
      images: { jpg: { image_url: user.avatar?.large || "https://s4.anilist.co/file/anilistcdn/user/avatar/default.png" } },
      joined: user.createdAt ? new Date(user.createdAt * 1000).toISOString() : null,
      last_online: "Recently",
      statistics: null
    });
  } catch (err: any) {
    res.status(404).json({ error: "User not found on AniList" });
  }
});

// MAL User Profile
router.get("/user/:username", async (req, res) => {
  const username = req.params.username?.trim();
  if (!username) { res.status(400).json({ error: "Username is required" }); return; }

  const cacheKey = username.toLowerCase();
  const cached = profileCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) { res.json(cached.data); return; }

  try {
    const response = await fetch(`https://api.jikan.moe/v4/users/${encodeURIComponent(username)}`, { headers: HEADERS });
    if (response.status === 404) { res.status(404).json({ error: "User not found on MyAnimeList" }); return; }
    if (!response.ok) throw new Error(`Jikan API returned ${response.status}`);

    const body = await response.json();
    profileCache.set(cacheKey, { data: body.data, timestamp: Date.now() });
    res.json(body.data);
  } catch (err: any) {
    res.json({
      username: username, url: `https://myanimelist.net/profile/${username}`,
      images: { jpg: { image_url: "https://cdn.myanimelist.net/images/questionmark_250.gif" } },
      joined: null, last_online: "Recently", statistics: null
    });
  }
});

// MAL Scrape Anime
router.get("/scrape/anime/:username", async (req, res) => {
  const username = req.params.username?.trim();
  if (!username) { res.status(400).json({ error: "Username is required" }); return; }

  let allItems: any[] = [];
  let offset = 0;
  let hasMore = true;
  let attempts = 0;

  try {
    while (hasMore && attempts < 20) {
      attempts++;
      const url = `https://myanimelist.net/animelist/${encodeURIComponent(username)}/load.json?offset=${offset}&status=7`;
      const response = await fetch(url, { headers: HEADERS });
      
      if (response.status === 404) { res.status(404).json({ error: "User not found or their anime list is private." }); return; }
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) break;

      allItems.push(...data);
      if (data.length < 300) hasMore = false;
      else { offset += 300; await delay(250); }
    }
    res.json({ source: "network", count: allItems.length, data: allItems });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to scrape MyAnimeList.", details: err.message });
  }
});

// MAL Scrape Manga
router.get("/scrape/manga/:username", async (req, res) => {
  const username = req.params.username?.trim();
  if (!username) { res.status(400).json({ error: "Username is required" }); return; }

  let allItems: any[] = [];
  let offset = 0;
  let hasMore = true;
  let attempts = 0;

  try {
    while (hasMore && attempts < 20) {
      attempts++;
      const url = `https://myanimelist.net/mangalist/${encodeURIComponent(username)}/load.json?offset=${offset}&status=7`;
      const response = await fetch(url, { headers: HEADERS });
      
      if (response.status === 404) { res.status(404).json({ error: "User not found or their manga list is private." }); return; }
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) break;

      allItems.push(...data);
      if (data.length < 300) hasMore = false;
      else { offset += 300; await delay(250); }
    }
    res.json({ source: "network", count: allItems.length, data: allItems });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to scrape MyAnimeList.", details: err.message });
  }
});

// AniList Scrape Lists
router.get("/scrape/anilist/list/:type/:username", async (req, res) => {
  const type = req.params.type?.trim().toUpperCase();
  const username = req.params.username?.trim();

  if (!username || (type !== "ANIME" && type !== "MANGA")) { res.status(400).json({ error: "Invalid parameters" }); return; }

  let allItems: any[] = [];
  let page = 1;
  let hasNextPage = true;

  try {
    while (hasNextPage) {
      const query = `
        query ($userName: String, $type: MediaType, $page: Int) {
          Page(page: $page, perPage: 50) {
            pageInfo { hasNextPage }
            mediaList(userName: $userName, type: $type) {
              status score(format: POINT_10) progress progressVolumes repeat
              startedAt { year month day } completedAt { year month day }
              media { id idMal title { romaji english userPreferred } format type status episodes volumes chapters coverImage { large } }
            }
          }
        }
      `;
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ query, variables: { userName: username, type, page } })
      });

      if (response.status === 404) throw new Error("User not found or list is private.");
      if (!response.ok) throw new Error(`AniList returned ${response.status}`);
      const body = await response.json();
      if (body.errors) throw new Error(body.errors[0]?.message || "GraphQL error");

      const pageData = body.data.Page;
      const listData = pageData.mediaList;
      
      const mappedItems = listData.map((item: any) => {
        let malStatus = 1; 
        if (item.status === "CURRENT" || item.status === "REPEATING") malStatus = 1;
        if (item.status === "COMPLETED") malStatus = 2;
        if (item.status === "PAUSED") malStatus = 3;
        if (item.status === "DROPPED") malStatus = 4;
        if (item.status === "PLANNING") malStatus = 6;

        let airingStatus = 2;
        if (item.media.status === "RELEASING") airingStatus = 1;
        if (item.media.status === "NOT_YET_RELEASED") airingStatus = 3;

        const startDateStr = item.startedAt?.year ? `${item.startedAt.year}-${String(item.startedAt.month || 1).padStart(2, '0')}-${String(item.startedAt.day || 1).padStart(2, '0')}` : null;
        const finishDateStr = item.completedAt?.year ? `${item.completedAt.year}-${String(item.completedAt.month || 1).padStart(2, '0')}-${String(item.completedAt.day || 1).padStart(2, '0')}` : null;

        if (type === "ANIME") {
          return {
            status: malStatus, score: Math.round(item.score || 0), num_watched_episodes: item.progress || 0,
            anime_title: item.media.title.userPreferred || item.media.title.romaji, anime_title_eng: item.media.title.english || item.media.title.userPreferred || item.media.title.romaji, anime_num_episodes: item.media.episodes || 0,
            anime_airing_status: airingStatus, anime_id: item.media.idMal || item.media.id, anilist_id: item.media.id,
            anime_image_path: item.media.coverImage?.large, anime_media_type_string: item.media.format || "TV",
            is_rewatching: item.status === "REPEATING" ? 1 : 0, start_date_string: startDateStr, finish_date_string: finishDateStr
          };
        } else {
          return {
            status: malStatus, score: Math.round(item.score || 0), num_read_volumes: item.progressVolumes || 0, num_read_chapters: item.progress || 0,
            manga_title: item.media.title.userPreferred || item.media.title.romaji, manga_title_eng: item.media.title.english || item.media.title.userPreferred || item.media.title.romaji, manga_num_volumes: item.media.volumes || 0,
            manga_num_chapters: item.media.chapters || 0, manga_publishing_status: airingStatus, manga_id: item.media.idMal || item.media.id,
            anilist_id: item.media.id, manga_image_path: item.media.coverImage?.large, manga_media_type_string: item.media.format || "Manga",
            start_date_string: startDateStr, finish_date_string: finishDateStr
          };
        }
      });

      allItems.push(...mappedItems);
      hasNextPage = pageData.pageInfo.hasNextPage;
      page++;
      await delay(300);
    }
    res.json({ source: "network", count: allItems.length, data: allItems });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.use("/api", router);
app.use("/.netlify/functions/api", router);

export { app };
export const handler = serverless(app, { binary: true });