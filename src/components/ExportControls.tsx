import React, { useState, useRef, useEffect } from "react";
import {
  Download,
  FileText,
  Clipboard,
  Check,
  Share2,
  FileSpreadsheet,
  FileJson,
  FileCode,
  Image as ImageIcon,
  X,
  ListFilter,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RawAnimeItem, RawMangaItem, ListType } from "../types";
import { PlatformType } from "./ScrapeConsole";

type ExportItem = RawAnimeItem | RawMangaItem;

interface ExportControlsProps {
  animeList: RawAnimeItem[];
  mangaList: RawMangaItem[];
  /** The list currently visible in ListGridTable after search/status/format filters + sort. */
  filteredList: ExportItem[];
  currentType: ListType;
  username: string;
  platform: PlatformType;
  nameLanguage: "romaji" | "english";
  /** The app's own light/dark toggle — the share card mirrors it alongside its platform coloring. */
  appTheme: "light" | "dark";
  /** The scraped profile's real avatar (MAL/AniList CDN image), used on the share card when it can be loaded cross-origin. */
  avatarUrl?: string;
}

const NotionIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
  >
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
  </svg>
);

const MihonIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="142 146 148 140.25"
    className={className}
    fill="currentColor"
  >
    <path d="M162.3,173.59L161.22,148.63C164.47,149.25 168.35,149.41 177.18,149.41C187.87,149.41 201.98,148.79 209.26,147.86C212.36,147.55 213.6,147.09 215.61,146L232.35,160.26C230.8,162.43 230.34,163.36 228.63,167.7C227.24,171.11 220.88,190.79 218.4,199.16C229.87,201.48 236.22,203.18 244.9,206.75C245.99,199.16 246.14,195.13 246.14,181.33C246.14,177.77 245.99,175.76 245.52,172.5L272.49,173.43C271.71,177.15 271.56,178.7 271.4,184.74C270.78,199.31 270.16,206.29 268.61,216.82C279.31,222.25 279.31,222.25 284.73,225.19C287.52,226.74 288.14,227.05 290,227.67L281.01,256.65C276.67,252.78 270.63,248.59 261.8,243.63C254.05,262.08 241.18,275.56 221.66,286.25C215.15,277.57 210.19,272.3 202.29,266.11C213.75,260.68 219.02,257.27 225.07,251.54C230.96,245.8 234.83,240.22 238.55,231.85C228.63,227.36 222.28,225.35 211.27,223.02C204.92,241.93 199.8,254.02 195.31,261.3C189.27,271.06 181.05,276.18 171.6,276.18C164.32,276.18 156.88,272.92 151.45,267.35C145.25,260.99 142,252.16 142,241.93C142,226.74 149.28,213.57 161.99,205.35C170.21,200.09 178.88,197.76 192.68,196.99C195.47,187.84 197.79,179.94 199.96,171.11C193.14,171.73 184.62,172.19 174.24,172.65C168.66,172.81 166.8,172.96 162.3,173.59ZM185.86,220.7C178.57,221.94 174.24,224.26 170.36,229.22C167.42,232.63 166.02,236.66 166.02,241C166.02,245.8 168.35,249.37 171.29,249.37C174.85,249.37 178.88,241.31 185.86,220.7Z" />
  </svg>
);

// Small canvas helper: draws a rounded-rect path (caller fills/strokes it).
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

// Draws an image cropped to a circle, "cover"-fit (like CSS object-fit: cover) so
// non-square avatars fill the circle without stretching.
function drawCoverImageInCircle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  r: number
) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  const scale = Math.max((r * 2) / iw, (r * 2) / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

// Per-platform + per-app-theme coloring for the share card. Platform sets the brand
// colors (MAL's blue navbar, AniList's dark navy + cyan accent); the app's own
// light/dark toggle then picks a light or dark rendition of that same brand, so the
// card visibly reads as "from MAL" or "from AniList" AND matches how the person is
// currently using the app.
const SHARE_CARD_THEMES = {
  "mal-dark": {
    name: "MyAnimeList",
    shortName: "MAL",
    bgFrom: "#2e51a2",
    bgTo: "#182f66",
    accent: "#ffffff",
    accentContrast: "#2e51a2",
    accentSoft: "rgba(255,255,255,0.16)",
    heading: "#ffffff",
    muted: "rgba(255,255,255,0.68)",
    chipBg: "rgba(255,255,255,0.10)",
    chipBorder: "rgba(255,255,255,0.22)",
    barTrack: "rgba(255,255,255,0.18)",
    badgeBg: "#ffffff",
    badgeIcon: "#2e51a2",
    glow: "rgba(255,255,255,0.16)",
  },
  "mal-light": {
    name: "MyAnimeList",
    shortName: "MAL",
    bgFrom: "#eef3fc",
    bgTo: "#dbe6f7",
    accent: "#2e51a2",
    accentContrast: "#ffffff",
    accentSoft: "rgba(46,81,162,0.10)",
    heading: "#16213e",
    muted: "rgba(22,33,62,0.62)",
    chipBg: "rgba(46,81,162,0.06)",
    chipBorder: "rgba(46,81,162,0.22)",
    barTrack: "rgba(22,33,62,0.10)",
    badgeBg: "#2e51a2",
    badgeIcon: "#ffffff",
    glow: "rgba(46,81,162,0.14)",
  },
  "anilist-dark": {
    name: "AniList",
    shortName: "ANILIST",
    bgFrom: "#0b1622",
    bgTo: "#13233a",
    accent: "#3db4f2",
    accentContrast: "#0b1622",
    accentSoft: "rgba(61,180,242,0.16)",
    heading: "#f4f8fb",
    muted: "rgba(244,248,251,0.62)",
    chipBg: "rgba(255,255,255,0.05)",
    chipBorder: "rgba(61,180,242,0.28)",
    barTrack: "rgba(255,255,255,0.10)",
    badgeBg: "#3db4f2",
    badgeIcon: "#0b1622",
    glow: "rgba(61,180,242,0.22)",
  },
  "anilist-light": {
    name: "AniList",
    shortName: "ANILIST",
    bgFrom: "#f3f9fc",
    bgTo: "#e2eef5",
    accent: "#1f8fcf",
    accentContrast: "#ffffff",
    accentSoft: "rgba(31,143,207,0.10)",
    heading: "#0e2233",
    muted: "rgba(14,34,51,0.62)",
    chipBg: "rgba(31,143,207,0.07)",
    chipBorder: "rgba(31,143,207,0.25)",
    barTrack: "rgba(14,34,51,0.10)",
    badgeBg: "#1f8fcf",
    badgeIcon: "#ffffff",
    glow: "rgba(31,143,207,0.16)",
  },
} as const;

// Draws the app's real logo (public/favicon.svg) clipped into a rounded square.
// Falls back to a simple hand-drawn open-book mark if the image hasn't loaded yet,
// so the card can still render immediately on first open.
function drawLogoBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  badgeBg: string,
  iconColor: string,
  logoImg: HTMLImageElement | null
) {
  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    ctx.save();
    roundRect(ctx, x, y, size, size, size * 0.24);
    ctx.clip();
    ctx.drawImage(logoImg, x, y, size, size);
    ctx.restore();
    return;
  }

  // Fallback mark (pre-image-load only)
  roundRect(ctx, x, y, size, size, size * 0.28);
  ctx.fillStyle = badgeBg;
  ctx.fill();

  const cx = x + size / 2;
  const cy = y + size / 2;
  const w = size * 0.5;
  const h = size * 0.34;

  ctx.strokeStyle = iconColor;
  ctx.lineWidth = size * 0.07;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Spine
  ctx.beginPath();
  ctx.moveTo(cx, cy - h / 2);
  ctx.lineTo(cx, cy + h / 2);
  ctx.stroke();

  // Left page
  ctx.beginPath();
  ctx.moveTo(cx, cy - h / 2);
  ctx.quadraticCurveTo(cx - w / 2, cy - h / 2 - size * 0.05, cx - w / 2, cy);
  ctx.quadraticCurveTo(cx - w / 2, cy + h / 2 + size * 0.05, cx, cy + h / 2);
  ctx.stroke();

  // Right page
  ctx.beginPath();
  ctx.moveTo(cx, cy - h / 2);
  ctx.quadraticCurveTo(cx + w / 2, cy - h / 2 - size * 0.05, cx + w / 2, cy);
  ctx.quadraticCurveTo(cx + w / 2, cy + h / 2 + size * 0.05, cx, cy + h / 2);
  ctx.stroke();
}

export default function ExportControls({
  animeList,
  mangaList,
  filteredList,
  currentType,
  username,
  platform,
  nameLanguage,
  appTheme,
  avatarUrl,
}: ExportControlsProps) {
  const [copied, setCopied] = useState(false);

  // Scope-confirmation modal state: which export action is pending a scope choice.
  const [pendingExport, setPendingExport] = useState<{
    label: string;
    run: (list: ExportItem[]) => void;
  } | null>(null);

  // Native XML export gets its own modal (always shown, filtered or not) since it has
  // an extra option: whether to mark entries with update_on_import for re-import tools.
  const [xmlModalOpen, setXmlModalOpen] = useState(false);
  const [xmlUpdateOnImport, setXmlUpdateOnImport] = useState(true);

  // Share card preview state.
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [shareCardList, setShareCardList] = useState<ExportItem[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Same logo used in the site header (public/favicon.svg), reused for the share card branding.
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  // The scraped profile's real avatar photo, loaded cross-origin when possible.
  // Stays null (falls back to an initial-letter medallion) if it fails to load or
  // the source doesn't allow cross-origin canvas use.
  const avatarImgRef = useRef<HTMLImageElement | null>(null);

  const activeList = currentType === "anime" ? animeList : mangaList;

  // Helper: Title Language
  const getTitle = (item: any) => {
    if (currentType === "anime") {
      const eng = item.anime_title_eng;
      return nameLanguage === "english" && eng ? eng : item.anime_title;
    } else {
      const eng = item.manga_title_eng || item.manga_english;
      return nameLanguage === "english" && eng ? eng : item.manga_title;
    }
  };

  // Helper: Status label getter
  const getStatusText = (status: number) => {
    switch (status) {
      case 1: return currentType === "anime" ? "Watching" : "Reading";
      case 2: return "Completed";
      case 3: return "On Hold";
      case 4: return "Dropped";
      case 6: return currentType === "anime" ? "Plan to Watch" : "Plan to Read";
      default: return "Unknown";
    }
  };

  // Routes an export action through the scope-confirmation modal whenever the
  // person currently has search/status/format filters narrowing the visible list.
  // If nothing is filtered (or filteredList hasn't been reported yet), it just runs.
  const requestExport = (run: (list: ExportItem[]) => void, label: string) => {
    if (activeList.length === 0) return;

    const hasActiveFilter =
      filteredList.length > 0 && filteredList.length !== activeList.length;

    if (!hasActiveFilter) {
      run(activeList);
      return;
    }

    setPendingExport({ label, run });
  };

  // XML always gets its own confirmation popup (for the update_on_import toggle),
  // whether or not any search/status/format filters are currently active.
  const openXmlModal = () => {
    if (activeList.length === 0) return;
    setXmlModalOpen(true);
  };

  // 1. Download CSV
  const downloadCSV = (dataList: ExportItem[]) => {
    if (dataList.length === 0) return;

    let headers: string[] = [];
    let rows: any[][] = [];

    if (currentType === "anime") {
      headers = [
        "Anime ID",
        "Title",
        "Score",
        "Progress Episodes",
        "Total Episodes",
        "Media Type",
        "Status",
        "Start Date",
        "Finish Date",
      ];
      rows = dataList.map((item: any) => [
        item.anime_id,
        `"${getTitle(item).replace(/"/g, '""')}"`, // escape quotes
        item.score,
        item.num_watched_episodes,
        item.anime_num_episodes,
        item.anime_media_type_string || "Unknown",
        getStatusText(item.status),
        item.start_date_string || "N/A",
        item.finish_date_string || "N/A",
      ]);
    } else {
      headers = [
        "Manga ID",
        "Title",
        "Score",
        "Progress Chapters",
        "Progress Volumes",
        "Total Volumes",
        "Media Type",
        "Status",
        "Start Date",
        "Finish Date",
      ];
      rows = dataList.map((item: any) => [
        item.manga_id,
        `"${getTitle(item).replace(/"/g, '""')}"`,
        item.score,
        item.num_read_chapters,
        item.num_read_volumes,
        item.manga_num_volumes,
        item.manga_media_type_string || "Unknown",
        getStatusText(item.status),
        item.start_date_string || "N/A",
        item.finish_date_string || "N/A",
      ]);
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    triggerDownload(csvContent, "text/csv;charset=utf-8;", `${platform}_scraped_${username}_${currentType}.csv`);
  };

  // 1.5 Download Notion CSV
  const downloadNotionCSV = (dataList: ExportItem[]) => {
    if (dataList.length === 0) return;

    // Notion maps: Name (Title), Status (Select), Score (Number), Progress (Number), Total (Number), Cover (Files & media), Format (Select), Link (URL)
    const headers = ["Name", "Status", "Score", "Progress", "Total", "Cover", "Format", "Link"];
    let rows: any[][] = [];

    if (currentType === "anime") {
      rows = dataList.map((item: any) => [
        `"${getTitle(item).replace(/"/g, '""')}"`,
        getStatusText(item.status),
        item.score > 0 ? item.score : "",
        item.num_watched_episodes,
        item.anime_num_episodes,
        item.anime_image_path || "",
        item.anime_media_type_string || "Unknown",
        `"${platform === 'mal' ? 'https://myanimelist.net' : 'https://anilist.co'}/anime/${item.anime_id}"`,
      ]);
    } else {
      rows = dataList.map((item: any) => [
        `"${getTitle(item).replace(/"/g, '""')}"`,
        getStatusText(item.status),
        item.score > 0 ? item.score : "",
        item.num_read_chapters,
        item.manga_num_chapters,
        item.manga_image_path || "",
        item.manga_media_type_string || "Unknown",
        `"${platform === 'mal' ? 'https://myanimelist.net' : 'https://anilist.co'}/manga/${item.manga_id}"`,
      ]);
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    triggerDownload(csvContent, "text/csv;charset=utf-8;", `${platform}_notion_template_${username}_${currentType}.csv`);
  };

  // 2. Download JSON
  const downloadJSON = (dataList: ExportItem[]) => {
    if (dataList.length === 0) return;
    const jsonString = JSON.stringify(dataList, null, 2);
    triggerDownload(jsonString, "application/json;charset=utf-8;", `${platform}_scraped_${username}_${currentType}.json`);
  };

  // 2.2 Download Mihon/Tachiyomi Tracking Sync (Manga Only)
  const downloadMihonSync = (dataList: ExportItem[]) => {
    if (dataList.length === 0 || currentType !== "manga") return;

    const syncData = dataList.map((item: any) => ({
      manga_id: item.manga_id,
      title: getTitle(item),
      tracker: platform === 'mal' ? "myanimelist" : "anilist",
      status: item.status, // 1: Reading, 2: Completed, 3: On Hold, 4: Dropped, 6: PTR
      score: item.score,
      last_chapter_read: item.num_read_chapters
    }));

    const jsonString = JSON.stringify(syncData, null, 2);
    triggerDownload(jsonString, "application/json;charset=utf-8;", `mihon_tracker_sync_${username}.json`);
  };

  // 2.5 Download MAL XML
  const downloadXML = (dataList: ExportItem[], updateOnImport: boolean = true) => {
    if (dataList.length === 0) return;

    const dt = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateFormatted = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
    const updateOnImportValue = updateOnImport ? 1 : 0;

    let xmlContent = `<?xml version="1.0" encoding="UTF-8" ?>\n`;
    xmlContent += `<!--\n Created by ${platform === 'mal' ? 'MAL' : 'AniList'} Scraper Engine\n Version 1.1.0\n-->\n`;
    xmlContent += `<myanimelist>\n`;
    xmlContent += `\t<myinfo>\n`;
    xmlContent += `\t\t<user_id>0</user_id>\n`;
    xmlContent += `\t\t<user_name><![CDATA[${username}]]></user_name>\n`;

    if (currentType === "anime") {
      xmlContent += `\t\t<user_export_type>1</user_export_type>\n`;
      xmlContent += `\t\t<user_total_anime>${dataList.length}</user_total_anime>\n`;
      xmlContent += `\t\t<user_total_watching>${dataList.filter((i: any) => i.status === 1).length}</user_total_watching>\n`;
      xmlContent += `\t\t<user_total_completed>${dataList.filter((i: any) => i.status === 2).length}</user_total_completed>\n`;
      xmlContent += `\t\t<user_total_onhold>${dataList.filter((i: any) => i.status === 3).length}</user_total_onhold>\n`;
      xmlContent += `\t\t<user_total_dropped>${dataList.filter((i: any) => i.status === 4).length}</user_total_dropped>\n`;
      xmlContent += `\t\t<user_total_plantowatch>${dataList.filter((i: any) => i.status === 6).length}</user_total_plantowatch>\n`;
    } else {
      xmlContent += `\t\t<user_export_type>2</user_export_type>\n`;
      xmlContent += `\t\t<user_total_manga>${dataList.length}</user_total_manga>\n`;
      xmlContent += `\t\t<user_total_reading>${dataList.filter((i: any) => i.status === 1).length}</user_total_reading>\n`;
      xmlContent += `\t\t<user_total_completed>${dataList.filter((i: any) => i.status === 2).length}</user_total_completed>\n`;
      xmlContent += `\t\t<user_total_onhold>${dataList.filter((i: any) => i.status === 3).length}</user_total_onhold>\n`;
      xmlContent += `\t\t<user_total_dropped>${dataList.filter((i: any) => i.status === 4).length}</user_total_dropped>\n`;
      xmlContent += `\t\t<user_total_plantoread>${dataList.filter((i: any) => i.status === 6).length}</user_total_plantoread>\n`;
    }
    xmlContent += `\t</myinfo>\n`;

    if (currentType === "anime") {
      dataList.forEach((item: any) => {
        xmlContent += `\t<anime>\n`;
        xmlContent += `\t\t<series_animedb_id>${item.anime_id}</series_animedb_id>\n`;
        xmlContent += `\t\t<series_title><![CDATA[${getTitle(item)}]]></series_title>\n`;
        xmlContent += `\t\t<series_type>${item.anime_media_type_string || 'TV'}</series_type>\n`;
        xmlContent += `\t\t<series_episodes>${item.anime_num_episodes || 0}</series_episodes>\n`;
        xmlContent += `\t\t<my_id>0</my_id>\n`;
        xmlContent += `\t\t<my_watched_episodes>${item.num_watched_episodes || 0}</my_watched_episodes>\n`;
        xmlContent += `\t\t<my_start_date>${item.start_date_string || '0000-00-00'}</my_start_date>\n`;
        xmlContent += `\t\t<my_finish_date>${item.finish_date_string || '0000-00-00'}</my_finish_date>\n`;
        xmlContent += `\t\t<my_score>${item.score || 0}</my_score>\n`;
        xmlContent += `\t\t<my_status>${getStatusText(item.status)}</my_status>\n`;
        xmlContent += `\t\t<my_times_watched>${item.is_rewatching ? 1 : 0}</my_times_watched>\n`;
        xmlContent += `\t\t<my_tags><![CDATA[]]></my_tags>\n`;
        xmlContent += `\t\t<update_on_import>${updateOnImportValue}</update_on_import>\n`;
        xmlContent += `\t</anime>\n`;
      });
    } else {
      dataList.forEach((item: any) => {
        xmlContent += `\t<manga>\n`;
        xmlContent += `\t\t<manga_mangadb_id>${item.manga_id}</manga_mangadb_id>\n`;
        xmlContent += `\t\t<manga_title><![CDATA[${getTitle(item)}]]></manga_title>\n`;
        xmlContent += `\t\t<manga_volumes>${item.manga_num_volumes || 0}</manga_volumes>\n`;
        xmlContent += `\t\t<manga_chapters>${item.manga_num_chapters || 0}</manga_chapters>\n`;
        xmlContent += `\t\t<my_id>0</my_id>\n`;
        xmlContent += `\t\t<my_read_volumes>${item.num_read_volumes || 0}</my_read_volumes>\n`;
        xmlContent += `\t\t<my_read_chapters>${item.num_read_chapters || 0}</my_read_chapters>\n`;
        xmlContent += `\t\t<my_start_date>${item.start_date_string || '0000-00-00'}</my_start_date>\n`;
        xmlContent += `\t\t<my_finish_date>${item.finish_date_string || '0000-00-00'}</my_finish_date>\n`;
        xmlContent += `\t\t<my_score>${item.score || 0}</my_score>\n`;
        xmlContent += `\t\t<my_status>${getStatusText(item.status)}</my_status>\n`;
        xmlContent += `\t\t<my_times_read>0</my_times_read>\n`;
        xmlContent += `\t\t<my_tags><![CDATA[]]></my_tags>\n`;
        xmlContent += `\t\t<update_on_import>${updateOnImportValue}</update_on_import>\n`;
        xmlContent += `\t</manga>\n`;
      });
    }

    xmlContent += `</myanimelist>\n`;

    triggerDownload(xmlContent, "text/xml;charset=utf-8;", `${platform}_export_${username}_${currentType}.xml`);
  };

  // 3. Download TXT Text Summary report
  const downloadTXT = (dataList: ExportItem[]) => {
    if (dataList.length === 0) return;

    const dateStr = new Date().toLocaleDateString();
    let textContent = `==================================================\n`;
    textContent += `${platform === 'mal' ? 'MYANIMELIST' : 'ANILIST'} PROFILE REPORT: ${username.toUpperCase()}\n`;
    textContent += `Export Type: ${currentType.toUpperCase()} | Generated: ${dateStr}\n`;
    textContent += `==================================================\n\n`;

    const scores = dataList.filter((item: any) => item.score > 0).map((item: any) => item.score);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : "N/A";

    textContent += `SUMMARY METRICS:\n`;
    textContent += `------------------\n`;
    textContent += `Total Saved Entries: ${dataList.length}\n`;
    textContent += `Average Scored Rating: ${avgScore}★\n`;
    textContent += `Completed Count: ${dataList.filter((item: any) => item.status === 2).length}\n`;
    textContent += `Plan to ${currentType === "anime" ? "Watch" : "Read"} Count: ${dataList.filter((item: any) => item.status === 6).length}\n\n`;

    textContent += `${currentType.toUpperCase()} LIST ITEMS:\n`;
    textContent += `------------------\n`;

    dataList.forEach((item: any, idx) => {
      const title = getTitle(item);
      const progress = currentType === "anime" ? item.num_watched_episodes : item.num_read_chapters;
      const totalUnits = currentType === "anime" ? item.anime_num_episodes : item.manga_num_chapters;
      const scoreLabel = item.score > 0 ? `${item.score}/10` : "Unrated";
      const statusLabel = getStatusText(item.status);

      textContent += `${idx + 1}. ${title}\n`;
      textContent += `   Status: ${statusLabel} | Score: ${scoreLabel}\n`;
      textContent += `   Progress: ${progress}/${totalUnits > 0 ? totalUnits : "?"} units\n`;
      textContent += `   ---------------------------------------------\n`;
    });

    triggerDownload(textContent, "text/plain;charset=utf-8;", `${platform}_report_${username}_${currentType}.txt`);
  };

  // Trigger file download utility
  const triggerDownload = (content: string, type: string, filename: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Copy Markdown Link to Clipboard
  const copyMarkdownToClipboard = (dataList: ExportItem[]) => {
    if (dataList.length === 0) return;

    const scores = dataList.filter((item: any) => item.score > 0).map((item: any) => item.score);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : "N/A";

    // Grab top 10 highest-rated items
    const topRated = [...dataList]
      .filter((item: any) => item.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10);

    const platformName = platform === 'mal' ? 'MyAnimeList' : 'AniList';
    const profileUrl = platform === 'mal' ? `https://myanimelist.net/profile/${username}` : `https://anilist.co/user/${username}`;

    let md = `### [${platformName}](${platform === 'mal' ? "https://myanimelist.net" : "https://anilist.co"}) profile for [${username}](${profileUrl})\n`;
    md += `* **Scrape Type:** ${currentType === "anime" ? "Anime List" : "Manga List"}\n`;
    md += `* **Total Entries:** ${dataList.length} items\n`;
    md += `* **Average Score:** ${avgScore}★\n\n`;

    if (topRated.length > 0) {
      md += `#### Top 10 Scored Favorites:\n`;
      topRated.forEach((item: any) => {
        const title = getTitle(item);
        md += `1. **${title}** - Score: **${item.score}/10** (${getStatusText(item.status)})\n`;
      });
    }

    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 5. Generate a shareable stats card (rendered to <canvas>, downloadable as PNG)
  const openShareCard = (dataList: ExportItem[]) => {
    if (dataList.length === 0) return;
    setShareCardList(dataList);
    setShareCardOpen(true);
  };

  const drawShareCard = (dataList: ExportItem[], canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const platformKey = platform === "mal" ? "mal" : "anilist";
    const themeKey = `${platformKey}-${appTheme === "light" ? "light" : "dark"}` as keyof typeof SHARE_CARD_THEMES;
    const theme = SHARE_CARD_THEMES[themeKey];

    // Trading-card proportions (close to a real card's 2.5x3.5in ratio), rendered at
    // high resolution and scaled down for preview via CSS.
    const W = 900;
    const H = 1260;
    canvas.width = W;
    canvas.height = H;

    // --- Outer frame: thick colored border + rounded corners, like a card sleeve ---
    const frame = 26;
    roundRect(ctx, 0, 0, W, H, 48);
    ctx.fillStyle = theme.accent;
    ctx.fill();

    // --- Inner card face ---
    const innerX = frame;
    const innerY = frame;
    const innerW = W - frame * 2;
    const innerH = H - frame * 2;
    roundRect(ctx, innerX, innerY, innerW, innerH, 32);
    const faceGrad = ctx.createLinearGradient(innerX, innerY, innerX, innerY + innerH);
    faceGrad.addColorStop(0, theme.bgFrom);
    faceGrad.addColorStop(1, theme.bgTo);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = faceGrad;
    ctx.fillRect(innerX, innerY, innerW, innerH);
    ctx.restore();

    const pad = 34;

    // --- Header: name on the left, big "HP"-style hero stat on the right ---
    const nameY = innerY + 52;
    ctx.textAlign = "left";
    ctx.fillStyle = theme.heading;
    const hpLabel = "HP";
    ctx.font = "700 24px 'Segoe UI', Arial, sans-serif";
    const hpLabelW = ctx.measureText(hpLabel).width;
    ctx.font = "800 46px 'Segoe UI', Arial, sans-serif";
    const hpValue = `${dataList.length}`;
    const hpValueW = ctx.measureText(hpValue).width;
    const hpBlockW = hpValueW + 8 + hpLabelW;
    const hpRight = innerX + innerW - pad;

    ctx.font = "800 30px 'Segoe UI', Arial, sans-serif";
    const nameMaxW = innerW - pad * 2 - hpBlockW - 20;
    const displayName = truncateToWidth(ctx, `@${username}`, nameMaxW);
    ctx.fillText(displayName, innerX + pad, nameY);

    ctx.fillStyle = theme.accent;
    ctx.font = "800 46px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(hpValue, hpRight, nameY + 4);
    ctx.font = "700 22px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = theme.muted;
    ctx.fillText(hpLabel, hpRight - hpValueW - 8, nameY + 4);
    ctx.textAlign = "left";

    // Stage line under the name
    const stageY = nameY + 30;
    ctx.fillStyle = theme.muted;
    ctx.font = "600 20px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(
      `${theme.name} · ${currentType === "anime" ? "Anime List" : "Manga List"}`,
      innerX + pad,
      stageY
    );

    // --- Art window: decorative gradient + glow + centered avatar ---
    const artX = innerX + pad;
    const artY = stageY + 22;
    const artW = innerW - pad * 2;
    const artH = 380;

    roundRect(ctx, artX, artY, artW, artH, 20);
    ctx.save();
    ctx.clip();

    const artGrad = ctx.createLinearGradient(artX, artY, artX + artW, artY + artH);
    artGrad.addColorStop(0, theme.accentSoft);
    artGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = theme.chipBg;
    ctx.fillRect(artX, artY, artW, artH);
    ctx.fillStyle = artGrad;
    ctx.fillRect(artX, artY, artW, artH);

    const glow = ctx.createRadialGradient(
      artX + artW / 2, artY + artH * 0.38, 20,
      artX + artW / 2, artY + artH * 0.38, artW * 0.55
    );
    glow.addColorStop(0, theme.glow);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(artX, artY, artW, artH);

    // Avatar "artwork" — real profile photo when available, initial-letter medallion otherwise
    const avatarR = 92;
    const avatarCx = artX + artW / 2;
    const avatarCy = artY + artH * 0.42;
    const avatarImg = avatarImgRef.current;
    const hasAvatarImg = !!avatarImg && avatarImg.complete && avatarImg.naturalWidth > 0;

    if (hasAvatarImg) {
      drawCoverImageInCircle(ctx, avatarImg!, avatarCx, avatarCy, avatarR);
      ctx.beginPath();
      ctx.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2);
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 4;
      ctx.stroke();
    } else {
      roundRect(ctx, avatarCx - avatarR, avatarCy - avatarR, avatarR * 2, avatarR * 2, avatarR);
      ctx.fillStyle = theme.accentSoft;
      ctx.fill();
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = theme.accent;
      ctx.font = "800 76px 'Segoe UI', Arial, sans-serif";
      ctx.fillText((username || "?").charAt(0).toUpperCase(), avatarCx, avatarCy + 28);
    }

    // Caption under the medallion, inside the art window
    ctx.textAlign = "center";
    ctx.fillStyle = theme.muted;
    ctx.font = "600 20px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(`${username}'s collection`, avatarCx, artY + artH - 34);
    ctx.textAlign = "left";
    ctx.restore();

    // Art window border + platform badge in the corner
    roundRect(ctx, artX, artY, artW, artH, 20);
    ctx.strokeStyle = theme.chipBorder;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "700 18px 'Segoe UI', Arial, sans-serif";
    const platformLabel = theme.shortName;
    const pillPadX = 16;
    const pillW = ctx.measureText(platformLabel).width + pillPadX * 2;
    const pillH = 34;
    const pillX = artX + artW - pillW - 14;
    const pillY = artY + 14;
    roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fillStyle = theme.chipBg;
    ctx.fill();
    ctx.strokeStyle = theme.chipBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = theme.accent;
    ctx.textAlign = "center";
    ctx.fillText(platformLabel, pillX + pillW / 2, pillY + pillH / 2 + 6);
    ctx.textAlign = "left";

    // --- "Moves": top 4 rated titles, styled as attacks with a cost + damage number ---
    const movesLabelY = artY + artH + 46;
    ctx.fillStyle = theme.heading;
    ctx.font = "800 22px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("TOP TITLES", innerX + pad, movesLabelY);

    const topRated = [...dataList]
      .filter((item: any) => item.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5);

    const movesTop = movesLabelY + 26;
    const rowH = 78;

    if (topRated.length === 0) {
      ctx.fillStyle = theme.muted;
      ctx.font = "500 20px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("No scored titles yet — rate a few to fill this out.", innerX + pad, movesTop + 16);
    } else {
      topRated.forEach((item: any, idx: number) => {
        const rowTop = movesTop + idx * rowH;
        const rowLeft = innerX + pad;
        const rowRight = innerX + innerW - pad;

        // Cost pips (filled = score-derived "energy" cost, out of 5)
        const pipCount = Math.min(5, Math.max(1, Math.round(item.score / 2)));
        const pipR = 8;
        let pipX = rowLeft + pipR;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(pipX, rowTop + pipR, pipR, 0, Math.PI * 2);
          ctx.fillStyle = i < pipCount ? theme.accent : theme.chipBg;
          ctx.fill();
          if (i >= pipCount) {
            ctx.strokeStyle = theme.chipBorder;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
          pipX += pipR * 2 + 6;
        }

        // Title + damage number
        const textX = rowLeft + 5 * (pipR * 2 + 6) + 10;
        ctx.fillStyle = theme.heading;
        ctx.font = "700 24px 'Segoe UI', Arial, sans-serif";
        const title = truncateToWidth(ctx, getTitle(item), rowRight - textX - 70);
        ctx.fillText(title, textX, rowTop + 20);

        ctx.textAlign = "right";
        ctx.fillStyle = theme.accent;
        ctx.font = "800 30px 'Segoe UI', Arial, sans-serif";
        ctx.fillText(`${item.score * 10}`, rowRight, rowTop + 24);
        ctx.textAlign = "left";

        // Flavor line: status of that entry
        ctx.fillStyle = theme.muted;
        ctx.font = "500 18px 'Segoe UI', Arial, sans-serif";
        ctx.fillText(getStatusText(item.status), textX, rowTop + 46);

        // Divider
        if (idx < topRated.length - 1) {
          ctx.strokeStyle = theme.chipBorder;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(rowLeft, rowTop + rowH - 18);
          ctx.lineTo(rowRight, rowTop + rowH - 18);
          ctx.stroke();
        }
      });
    }

    // --- Weakness / Resistance / Retreat-style stat row ---
    const scores = dataList.filter((item: any) => item.score > 0).map((item: any) => item.score);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : "N/A";
    const completedCount = dataList.filter((item: any) => item.status === 2).length;
    const totalUnits = dataList.reduce(
      (sum: number, item: any) =>
        sum + (currentType === "anime" ? item.num_watched_episodes || 0 : item.num_read_chapters || 0),
      0
    );

    const statRowY = movesTop + Math.max(topRated.length, 1) * rowH + 22;
    const statRowH = 78;
    const statCols = [
      { label: "AVG SCORE", value: `${avgScore}★` },
      { label: "COMPLETED", value: `${completedCount}` },
      { label: currentType === "anime" ? "EPISODES" : "CHAPTERS", value: `${totalUnits}` },
    ];

    roundRect(ctx, innerX + pad, statRowY, innerW - pad * 2, statRowH, 16);
    ctx.fillStyle = theme.chipBg;
    ctx.fill();
    ctx.strokeStyle = theme.chipBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const colW = (innerW - pad * 2) / 3;
    statCols.forEach((c, idx) => {
      const cx = innerX + pad + colW * idx + colW / 2;
      ctx.textAlign = "center";
      ctx.fillStyle = theme.heading;
      ctx.font = "800 26px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(c.value, cx, statRowY + 34);
      ctx.fillStyle = theme.muted;
      ctx.font = "700 14px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(c.label, cx, statRowY + 58);

      if (idx > 0) {
        ctx.strokeStyle = theme.chipBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(innerX + pad + colW * idx, statRowY + 14);
        ctx.lineTo(innerX + pad + colW * idx, statRowY + statRowH - 14);
        ctx.stroke();
      }
    });
    ctx.textAlign = "left";

    // --- Flavor text box ---
    const flavorY = statRowY + statRowH + 20;
    const flavorH = 62;
    roundRect(ctx, innerX + pad, flavorY, innerW - pad * 2, flavorH, 14);
    ctx.fillStyle = theme.chipBg;
    ctx.fill();
    ctx.strokeStyle = theme.chipBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const flavorText =
      completedCount > 0
        ? `Completed ${completedCount} of ${dataList.length} tracked titles so far — the collection keeps growing.`
        : `${dataList.length} titles tracked and counting — the collection keeps growing.`;
    ctx.fillStyle = theme.muted;
    ctx.font = "italic 500 17px 'Segoe UI', Arial, sans-serif";
    const wrapped = truncateToWidth(ctx, flavorText, innerW - pad * 2 - 32);
    ctx.fillText(wrapped, innerX + pad + 16, flavorY + flavorH / 2 + 6);

    // --- Footer: logo mark + app name + a fake "card number" ---
    const footerY = innerY + innerH - 30;
    const logoSize = 34;
    drawLogoBadge(ctx, innerX + pad, footerY - logoSize + 8, logoSize, theme.badgeBg, theme.badgeIcon, logoImgRef.current);

    ctx.fillStyle = theme.muted;
    ctx.font = "600 16px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("AniManga Exporter", innerX + pad + logoSize + 10, footerY - 8);

    ctx.textAlign = "right";
    ctx.fillStyle = theme.accent;
    ctx.font = "700 16px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(`No. ${String(dataList.length).padStart(3, "0")}`, innerX + innerW - pad, footerY - 8);
    ctx.textAlign = "left";
  };

  // Preload the shared logo image once; re-render the card if it finishes loading
  // while the preview happens to already be open.
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      logoImgRef.current = img;
      if (shareCardOpen && canvasRef.current) {
        drawShareCard(shareCardList, canvasRef.current);
      }
    };
    img.src = "/favicon.svg";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preload the profile's real avatar whenever it changes.
  // Stage 1: try loading directly with crossOrigin="anonymous". This works fine for
  // MAL's CDN (cdn.myanimelist.net), which sends proper CORS headers, and is faster
  // than round-tripping through our own proxy.
  // Stage 2: if the direct load fails (e.g. AniList's s4.anilist.co, which doesn't
  // send CORS headers), retry the same image through /api/image-proxy, which fetches
  // it server-side and re-serves it with CORS headers attached.
  // Only if BOTH fail do we fall back to the initial-letter medallion.
  useEffect(() => {
    avatarImgRef.current = null;
    let cancelled = false;

    const redraw = () => {
      if (!cancelled && shareCardOpen && canvasRef.current) {
        drawShareCard(shareCardList, canvasRef.current);
      }
    };

    if (!avatarUrl) {
      redraw();
      return () => {
        cancelled = true;
      };
    }

    const tryProxyFallback = () => {
      const proxied = new Image();
      proxied.crossOrigin = "anonymous";
      proxied.onload = () => {
        if (cancelled) return;
        avatarImgRef.current = proxied;
        redraw();
      };
      proxied.onerror = () => {
        if (cancelled) return;
        avatarImgRef.current = null; // both attempts failed — fall back to initials
        redraw();
      };
      proxied.src = `/api/image-proxy?url=${encodeURIComponent(avatarUrl)}`;
    };

    const direct = new Image();
    direct.crossOrigin = "anonymous";
    direct.onload = () => {
      if (cancelled) return;
      avatarImgRef.current = direct;
      redraw();
    };
    direct.onerror = () => {
      if (cancelled) return;
      tryProxyFallback();
    };
    direct.src = avatarUrl;

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarUrl]);

  useEffect(() => {
    if (shareCardOpen && canvasRef.current) {
      drawShareCard(shareCardList, canvasRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareCardOpen, shareCardList, appTheme, platform]);

  const downloadShareCardImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${platform}_sharecard_${username}_${currentType}.png`;
      link.click();
    } catch {
      // Some CDNs load the image fine but still taint the canvas for reads (rare,
      // inconsistent CORS setups). Drop the avatar, redraw with initials, and retry
      // once so the export never just silently fails.
      avatarImgRef.current = null;
      drawShareCard(shareCardList, canvas);
      try {
        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = url;
        link.download = `${platform}_sharecard_${username}_${currentType}.png`;
        link.click();
      } catch {
        // Give up quietly — extremely unlikely to reach this point.
      }
    }
  };

  const hasActiveFilter = filteredList.length > 0 && filteredList.length !== activeList.length;

  return (
    <div id="export-controls-root" className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="text-app-text font-semibold text-sm flex items-center gap-2">
          <Share2 className="w-4 h-4 text-app-accent" /> Export Data & Downloads
        </h5>
      </div>

      <p className="text-app-text-muted text-xs leading-relaxed">
        Save your scraped {platform === 'mal' ? 'MyAnimeList' : 'AniList'} database directly to your machine. Choose between spreadsheet-compatible formats or generate markdown/image report cards to post on social communities.
        {hasActiveFilter && (
          <span className="block mt-1 text-app-accent">
            Filters are active in the browser below ({filteredList.length} of {activeList.length} shown) — exports will ask which set to use.
          </span>
        )}
      </p>

      <div className="flex flex-wrap gap-3 pt-2">
        {/* CSV Button */}
        <button
          onClick={() => requestExport(downloadCSV, "CSV")}
          className="flex-1 min-w-[120px] bg-app-bg hover:bg-app-surface-hover text-app-text-muted hover:text-app-heading border border-app-border hover:border-app-border px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-mono font-medium transition-all duration-150 cursor-pointer hover:shadow-md"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-app-accent" />
          CSV
        </button>

        {/* JSON Button */}
        <button
          onClick={() => requestExport(downloadJSON, "JSON")}
          className="flex-1 min-w-[120px] bg-app-bg hover:bg-app-surface-hover text-app-text-muted hover:text-app-heading border border-app-border hover:border-app-border px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-mono font-medium transition-all duration-150 cursor-pointer hover:shadow-md"
        >
          <FileJson className="w-3.5 h-3.5 text-app-accent" />
          JSON
        </button>

        {/* Notion CSV Button */}
        <button
          onClick={() => requestExport(downloadNotionCSV, "Notion CSV")}
          className="flex-1 min-w-[120px] bg-app-bg hover:bg-app-surface-hover text-app-text-muted hover:text-app-heading border border-app-border hover:border-app-border px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-[11px] sm:text-xs font-mono font-medium transition-all duration-150 cursor-pointer hover:shadow-md"
          title="Export CSV mapped specifically for Notion Databases"
        >
          <NotionIcon className="w-3.5 h-3.5 text-app-accent" />
          Notion CSV
        </button>

        {/* XML Button */}
        <button
          onClick={openXmlModal}
          className="flex-1 min-w-[120px] bg-app-bg hover:bg-app-surface-hover text-app-text-muted hover:text-app-heading border border-app-border hover:border-app-border px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-[11px] sm:text-xs font-mono font-medium transition-all duration-150 cursor-pointer hover:shadow-md"
          title="MAL/AniList Migration XML (Standard MyAnimeList XML)"
        >
          <FileCode className="w-3.5 h-3.5 text-app-accent" />
          Native XML
        </button>

        {/* Mihon Sync Button (Manga Only) */}
        {currentType === "manga" && (
          <button
            onClick={() => requestExport(downloadMihonSync, "Mihon Sync")}
            className="flex-1 min-w-[120px] bg-app-bg hover:bg-app-surface-hover text-app-text-muted hover:text-app-heading border border-app-border hover:border-app-border px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-[11px] sm:text-xs font-mono font-medium transition-all duration-150 cursor-pointer hover:shadow-md"
            title="Mihon/Tachiyomi Tracker Mapping JSON"
          >
            <MihonIcon className="w-3.5 h-3.5 text-app-accent" />
            Mihon Sync
          </button>
        )}

        {/* Text Report Button */}
        <button
          onClick={() => requestExport(downloadTXT, "TXT Report")}
          className="flex-1 min-w-[120px] bg-app-bg hover:bg-app-surface-hover text-app-text-muted hover:text-app-heading border border-app-border hover:border-app-border px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-mono font-medium transition-all duration-150 cursor-pointer hover:shadow-md"
        >
          <FileText className="w-3.5 h-3.5 text-app-accent" />
          TXT Report
        </button>

        {/* Copy Markdown Button */}
        <button
          onClick={() => requestExport(copyMarkdownToClipboard, "Copy MD")}
          className={`flex-1 min-w-[120px] border px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-mono font-medium transition-all duration-150 cursor-pointer ${
            copied
              ? "bg-emerald-950 text-emerald-300 border-emerald-800"
              : "bg-app-bg hover:bg-app-surface-hover text-app-text-muted hover:text-app-heading border-app-border hover:border-app-border"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Copied MD!
            </>
          ) : (
            <>
              <Clipboard className="w-3.5 h-3.5 text-app-accent" />
              Copy MD
            </>
          )}
        </button>

        {/* Share Card Button */}
        <button
          onClick={() => requestExport(openShareCard, "Share Card")}
          className="flex-1 min-w-[120px] bg-app-bg hover:bg-app-surface-hover text-app-text-muted hover:text-app-heading border border-app-border hover:border-app-border px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-mono font-medium transition-all duration-150 cursor-pointer hover:shadow-md"
          title="Generate a shareable stats image (Top 10 + summary stats)"
        >
          <ImageIcon className="w-3.5 h-3.5 text-app-accent" />
          Share Card
        </button>
      </div>

      {/* Scope confirmation modal: All vs Filtered View */}
      <AnimatePresence>
        {pendingExport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPendingExport(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-app-surface border border-app-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h6 className="text-app-heading font-semibold text-sm">
                  Export scope — {pendingExport.label}
                </h6>
                <button
                  onClick={() => setPendingExport(null)}
                  className="text-app-text-faint hover:text-app-text transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-app-text-muted text-xs leading-relaxed">
                You have search, status, or format filters active in the list below. Choose which set of items to include.
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    pendingExport.run(filteredList);
                    setPendingExport(null);
                  }}
                  className="w-full flex items-center justify-between gap-2 bg-app-accent/10 hover:bg-app-accent/20 border border-app-accent/30 text-app-heading px-4 py-3 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ListFilter className="w-3.5 h-3.5 text-app-accent" />
                    Filtered View
                  </span>
                  <span className="text-app-text-muted font-mono">{filteredList.length} items</span>
                </button>

                <button
                  onClick={() => {
                    pendingExport.run(activeList);
                    setPendingExport(null);
                  }}
                  className="w-full flex items-center justify-between gap-2 bg-app-bg hover:bg-app-surface-hover border border-app-border text-app-heading px-4 py-3 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-app-text-muted" />
                    Entire List
                  </span>
                  <span className="text-app-text-muted font-mono">{activeList.length} items</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Native XML export modal: always shown (filtered or not), carries the
          update_on_import toggle plus a scope choice when filters are active. */}
      <AnimatePresence>
        {xmlModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setXmlModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-app-surface border border-app-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h6 className="text-app-heading font-semibold text-sm flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-app-accent" />
                  Export Native XML
                </h6>
                <button
                  onClick={() => setXmlModalOpen(false)}
                  className="text-app-text-faint hover:text-app-text transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <label className="flex items-center justify-between gap-3 bg-app-bg border border-app-border rounded-xl px-4 py-3 cursor-pointer select-none">
                <span className="text-app-text text-sm flex items-center gap-2 flex-wrap">
                  Enable
                  <code className="bg-app-surface-hover border border-app-border px-1.5 py-0.5 rounded text-xs font-mono text-app-text-muted">
                    update_on_import
                  </code>
                </span>
                <input
                  type="checkbox"
                  checked={xmlUpdateOnImport}
                  onChange={(e) => setXmlUpdateOnImport(e.target.checked)}
                  className="w-4 h-4 accent-app-accent cursor-pointer shrink-0"
                />
              </label>

              {hasActiveFilter ? (
                <>
                  <p className="text-app-text-muted text-xs leading-relaxed">
                    You have search, status, or format filters active in the list below. Choose which set of items to export.
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        downloadXML(filteredList, xmlUpdateOnImport);
                        setXmlModalOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-2 bg-app-accent/10 hover:bg-app-accent/20 border border-app-accent/30 text-app-heading px-4 py-3 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <ListFilter className="w-3.5 h-3.5 text-app-accent" />
                        Filtered View
                      </span>
                      <span className="text-app-text-muted font-mono">{filteredList.length} items</span>
                    </button>

                    <button
                      onClick={() => {
                        downloadXML(activeList, xmlUpdateOnImport);
                        setXmlModalOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-2 bg-app-bg hover:bg-app-surface-hover border border-app-border text-app-heading px-4 py-3 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-app-text-muted" />
                        Entire List
                      </span>
                      <span className="text-app-text-muted font-mono">{activeList.length} items</span>
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => {
                    downloadXML(activeList, xmlUpdateOnImport);
                    setXmlModalOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-app-accent hover:bg-app-accent-hover text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export XML ({activeList.length} items)
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share card preview modal */}
      <AnimatePresence>
        {shareCardOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShareCardOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-app-surface border border-app-border rounded-2xl p-5 max-w-sm w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h6 className="text-app-heading font-semibold text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-app-accent" />
                  Share Card Preview
                </h6>
                <button
                  onClick={() => setShareCardOpen(false)}
                  className="text-app-text-faint hover:text-app-text transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <canvas ref={canvasRef} className="w-full h-auto rounded-xl border border-app-border" />

              <div className="flex gap-3">
                <button
                  onClick={downloadShareCardImage}
                  className="flex-1 bg-app-accent hover:bg-app-accent-hover text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PNG
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}