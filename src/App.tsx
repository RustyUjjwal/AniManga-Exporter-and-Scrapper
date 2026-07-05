import React, { useState, useEffect } from "react";
import { 
  Database, 
  HelpCircle, 
  Sparkles, 
  User, 
  Flame, 
  Tv, 
  BookOpen, 
  Calendar, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ScrapeConsole, { PlatformType } from "./components/ScrapeConsole";
import StatsSection from "./components/StatsSection";
import ListGridTable from "./components/ListGridTable";
import ExportControls from "./components/ExportControls";
import { LogEntry, ListType, RawAnimeItem, RawMangaItem, UserProfile } from "./types";

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [animeList, setAnimeList] = useState<RawAnimeItem[]>([]);
  const [mangaList, setMangaList] = useState<RawMangaItem[]>([]);
  const [currentType, setCurrentType] = useState<ListType>("anime");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [scrapedUsername, setScrapedUsername] = useState("");
  const [scrapedType, setScrapedType] = useState<ListType>("anime");
  const [scrapedPlatform, setScrapedPlatform] = useState<PlatformType>("mal");
  const [error, setError] = useState<string | null>(null);
  // Mirrors whatever ListGridTable currently has filtered/sorted into view,
  // so ExportControls can offer "export just what I'm looking at".
  const [filteredList, setFilteredList] = useState<(RawAnimeItem | RawMangaItem)[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [nameLanguage, setNameLanguage] = useState<"romaji" | "english">(() => {
    try {
      const saved = localStorage.getItem("animanga-name-language");
      return (saved === "english" || saved === "romaji") ? saved : "romaji";
    } catch {
      return "romaji";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("animanga-name-language", nameLanguage);
    } catch {}
  }, [nameLanguage]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("animanga-theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("animanga-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  // Helper to add timestamped console logs
  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const timestamp = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setLogs((prev) => [...prev, { timestamp, message, type }]);
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Core Scraping Execution Orchestrator
  const startScrape = async (username: string, type: ListType, platform: PlatformType) => {
    setIsLoading(true);
    setProgress(5);
    setLogs([]);
    setError(null);
    setCurrentType(type);

    addLog(`Initializing scraper sequence for user: '${username}' on ${platform.toUpperCase()}`, "info");
    await delay(200);
    addLog(`Establishing connection to ${platform === 'mal' ? 'MyAnimeList' : 'AniList'} servers...`, "info");
    setProgress(15);
    await delay(300);

    try {
      // Step 1: Retrieve profile details from Jikan with Express fallback
      addLog(`Requesting profile statistics and joined metadata...`, "info");
      
      const userEndpoint = platform === 'mal' 
        ? `/api/user/${encodeURIComponent(username)}` 
        : `/api/user/anilist/${encodeURIComponent(username)}`;
        
      const userRes = await fetch(userEndpoint);
      
      if (userRes.status === 404) {
        throw new Error(`${platform === 'mal' ? 'MyAnimeList' : 'AniList'} profile not found. Please double-check the spelling.`);
      }

      const profileData: UserProfile = await userRes.json();
      setUserProfile(profileData);
      
      addLog(`Successfully matched profile of [${profileData.username}]`, "success");
      if (profileData.last_online) {
        addLog(`User status: Online '${profileData.last_online}'`, "info");
      }
      setProgress(40);
      await delay(200);

      // Step 2: Fetch lists from Express scraper endpoint
      addLog(`Initiating load sequence for ${type === "anime" ? "Anime List" : "Manga List"} entries...`, "info");
      addLog(`Requesting pagination pages...`, "info");
      
      const scrapeEndpoint = platform === 'mal'
        ? `/api/scrape/${type}/${encodeURIComponent(username)}`
        : `/api/scrape/anilist/list/${type}/${encodeURIComponent(username)}`;

      const scrapeRes = await fetch(scrapeEndpoint);
      
      if (!scrapeRes.ok) {
        const errorBody = await scrapeRes.json();
        throw new Error(errorBody.error || `Server responded with status code ${scrapeRes.status}`);
      }

      const scrapeData = await scrapeRes.json();
      const listItems = scrapeData.data;

      setProgress(85);
      addLog(`Received response: Retrieved ${listItems.length} total ${type} list items.`, "success");
      await delay(200);

      // Save database list to specific states
      if (type === "anime") {
        setAnimeList(listItems as RawAnimeItem[]);
        setMangaList([]); // Clear other list to keep memory clean
      } else {
        setMangaList(listItems as RawMangaItem[]);
        setAnimeList([]); // Clear other list
      }

      addLog(`Parsing format categories and score segments...`, "info");
      setProgress(95);
      await delay(250);

      addLog(`Compilation successful. Initializing analytics module...`, "success");
      setProgress(100);
      
      // Finalizing states
      setScrapedUsername(profileData.username);
      setScrapedType(type);
      setScrapedPlatform(platform);
      setIsLoading(false);

    } catch (err: any) {
      setError(err.message);
      addLog(`Scrape operation failed: ${err.message}`, "error");
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-app-bg text-app-text font-sans flex flex-col justify-between selection:bg-indigo-500/35 selection:text-app-heading">
      
      {/* 1. Global Navigation Bar */}
      <header className="border-b border-app-border-strong bg-app-bg/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-app-accent/20 shrink-0">
              <img src="/favicon.svg" alt="AniManga Exporter logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-app-heading flex items-center gap-1.5 font-mono whitespace-nowrap">
                AniManga Exporter <span className="hidden sm:inline-block text-[10px] bg-app-accent/10 text-app-accent border border-app-accent/20 px-1.5 py-0.5 rounded font-normal">STABLE</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-app-surface border border-app-border-strong text-app-text-muted hover:text-app-heading transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Body Content Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Intro Hero Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-3.5 mb-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-app-heading tracking-tight">
            AniManga Scraper & Exporter
          </h2>
          <p className="text-sm text-app-text-muted leading-relaxed">
            Extract your entire public anime or manga database from MyAnimeList or AniList in seconds. Export to CSV, JSON, and native XML with interactive charts.
          </p>
        </div>

        {/* Scraper Panel & Console Section */}
        <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
          <ScrapeConsole
            onStartScrape={startScrape}
            isLoading={isLoading}
            logs={logs}
            currentProgress={progress}
          />
        </div>

        {/* Errors Block */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="max-w-4xl mx-auto bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl flex items-start gap-4"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-rose-400 text-sm font-semibold">Execution Aborted</h5>
                <p className="text-app-text-muted text-xs mt-1 leading-relaxed">{error}</p>
                <div className="flex items-center gap-2.5 mt-3.5 text-[10px] text-app-text-faint">
                  <button 
                    onClick={() => setError(null)} 
                    className="text-app-accent hover:underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Scraped Profile & Analytics Results View */}
        <AnimatePresence>
          {scrapedUsername && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 pt-4 border-t border-app-border-strong"
            >
              {/* User Profile Card */}
              {userProfile && (
                <div className="bg-app-surface border border-app-border rounded-2xl p-6 pt-12 md:p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-app-accent/10 border-l border-b border-app-accent/20 px-3.5 py-1.5 rounded-bl-xl text-[10px] font-mono text-app-accent flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Profile
                  </div>

                  {/* Profile Avatar */}
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-app-bg border-2 border-app-border shrink-0 shadow-inner">
                    <img
                      src={userProfile.images?.jpg?.image_url || "https://cdn.myanimelist.net/images/questionmark_250.gif"}
                      alt={scrapedUsername}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Profile Info Details */}
                  <div className="space-y-3.5 text-center md:text-left flex-1">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <h3 className="text-xl font-bold text-app-heading tracking-tight">{userProfile.username}</h3>
                        <a
                          href={userProfile.url || `https://myanimelist.net/profile/${userProfile.username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-app-text-faint hover:text-app-accent transition-colors"
                          title="View Official MyAnimeList Profile"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <p className="text-xs font-mono text-app-text-faint uppercase flex items-center justify-center md:justify-start gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-500" /> 
                        List Mode: {scrapedType === "anime" ? "Anime" : "Manga"}
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-xs text-app-text-muted font-mono">
                      {userProfile.joined && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-app-text-faint" />
                          <span>Joined: {new Date(userProfile.joined).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-app-text-faint" />
                        <span>Last Online: {userProfile.last_online || "Recently"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Segment */}
              <StatsSection
                animeList={animeList}
                mangaList={mangaList}
                currentType={scrapedType}
                profile={userProfile}
                theme={theme}
                nameLanguage={nameLanguage}
              />

              {/* Exports Panel */}
              <ExportControls
                animeList={animeList}
                mangaList={mangaList}
                filteredList={filteredList}
                currentType={scrapedType}
                username={scrapedUsername}
                platform={scrapedPlatform}
                nameLanguage={nameLanguage}
                appTheme={theme}
                avatarUrl={userProfile?.images?.jpg?.image_url}
              />

              {/* Data Table Grid List */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-app-accent" />
                  <h4 className="text-app-text font-bold text-base">Browse Databases</h4>
                </div>
                <ListGridTable
                  animeList={animeList}
                  mangaList={mangaList}
                  currentType={scrapedType}
                  platform={scrapedPlatform}
                  nameLanguage={nameLanguage}
                  setNameLanguage={setNameLanguage}
                  onFilteredListChange={setFilteredList}
                />
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* 3. Global Footer block */}
      <footer className="border-t border-app-border-strong bg-app-bg py-8 px-6 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-6 text-xs font-mono text-app-text-faint text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <ShieldCheck className="w-5 h-5 text-app-text-faint shrink-0 mb-1 sm:mb-0" />
              <span className="leading-relaxed">AniManga Exporter © 2026. All scrapes compiled server-side safely.</span>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-1.5 sm:gap-4 text-center">
              <span className="leading-relaxed px-4 sm:px-0">UNOFFICIAL MYANIMELIST & ANILIST DATA PARSER</span>
              <span className="hidden sm:inline opacity-50">●</span>
              <span className="leading-relaxed px-4 sm:px-0">POWERED BY JIKAN V4 & ANILIST GRAPHQL</span>
            </div>
          </div>
          
          <div className="flex flex-row items-center justify-center gap-6 mt-2">
            <a 
              href="https://myanimelist.net" 
              target="_blank" 
              rel="noreferrer" 
              className="text-app-text-muted hover:text-app-text transition-colors flex items-center gap-1.5"
            >
              MyAnimeList.net <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a 
              href="https://anilist.co" 
              target="_blank" 
              rel="noreferrer" 
              className="text-app-text-muted hover:text-app-text transition-colors flex items-center gap-1.5"
            >
              AniList.co <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}