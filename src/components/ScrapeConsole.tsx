import React, { useState } from "react";
import { Play, Terminal, HelpCircle, RefreshCw, Layers, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LogEntry, ListType } from "../types";

export type PlatformType = "mal" | "anilist";

const MALIcon = ({ className }: { className?: string }) => (
  <svg 
    role="img" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="currentColor"
  >
    <path d="M14.921 6.479c-.82 0-3.683 0-4.947 3.156-.662 1.652-.986 4.812.876 7.886l1.934-1.41s-.767-1.095-1.083-3.191h2.897l.022 3.19h2.604V8.835h-2.581v2.043l-2.46-.023s.413-2.408 2.877-2.336h2.454l-.572-2.04ZM0 6.528v9.624h2.348v-5.84l2.031 2.664 2.047-2.652v5.828h2.336V6.528H6.437L4.368 9.474 2.31 6.528Zm18.447.022v9.583h5.022L24 14.09h-3.232V6.55Z"/>
  </svg>
);

const AniListIcon = ({ className }: { className?: string }) => (
  <svg 
    role="img" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="currentColor"
  >
    <path d="M24 17.53v2.421c0 .71-.391 1.101-1.1 1.101h-5l-.057-.165L11.84 3.736c.106-.502.46-.788 1.053-.788h2.422c.71 0 1.1.391 1.1 1.1v12.38H22.9c.71 0 1.1.392 1.1 1.101zM11.034 2.947l6.337 18.104h-4.918l-1.052-3.131H6.019l-1.077 3.131H0L6.361 2.948h4.673zm-.66 10.96-1.69-5.014-1.541 5.015h3.23z"/>
  </svg>
);

interface ScrapeConsoleProps {
  onStartScrape: (username: string, type: ListType, platform: PlatformType) => void;
  isLoading: boolean;
  logs: LogEntry[];
  currentProgress: number;
}

export default function ScrapeConsole({
  onStartScrape,
  isLoading,
  logs,
  currentProgress,
}: ScrapeConsoleProps) {
  const [username, setUsername] = useState("");
  const [type, setType] = useState<ListType>("anime");
  const [platform, setPlatform] = useState<PlatformType>("mal");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser) {
      setError(`Please enter a valid ${platform === 'mal' ? 'MyAnimeList' : 'AniList'} username.`);
      return;
    }
    setError(null);
    onStartScrape(cleanUser, type, platform);
  };

  const handleDemoClick = (demoUser: string, demoPlatform?: PlatformType) => {
    setUsername(demoUser);
    setError(null);
    if (demoPlatform) {
      setPlatform(demoPlatform);
      onStartScrape(demoUser, type, demoPlatform);
    } else {
      onStartScrape(demoUser, type, platform);
    }
  };

  return (
    <div id="scrape-console-root" className="w-full">
      <div className="bg-app-surface rounded-2xl border border-app-border shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Console Header */}
        <div className="bg-app-bg px-6 py-4 flex items-center justify-between border-b border-app-border">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-app-text-muted font-mono text-xs flex items-center gap-1.5 ml-2">
              <Terminal className="w-3.5 h-3.5 text-app-accent" />
              scrape-engine v1.2.0
            </span>
          </div>
          <div className="text-app-text-faint text-xs font-mono hidden sm:block">
          </div>
        </div>

        {/* Input & Form Area */}
        <div className="p-6 md:p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex flex-col gap-3 mb-3">
                {/* Platform Selector */}
                <div className="flex w-full max-w-sm self-center bg-app-bg p-1.5 rounded-xl border border-app-border">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setPlatform("mal")}
                    className={`w-1/2 justify-center px-2 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold font-mono transition-all duration-200 flex items-center gap-1.5 sm:gap-2 border border-transparent ${
                      platform === "mal"
                        ? "bg-app-accent text-white shadow-md"
                        : "text-app-text-muted hover:text-app-text hover:bg-app-surface-hover hover:border-app-border"
                    }`}
                  >
                    <MALIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="truncate">MyAnimeList</span>
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setPlatform("anilist")}
                    className={`w-1/2 justify-center px-2 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold font-mono transition-all duration-200 flex items-center gap-1.5 sm:gap-2 border border-transparent ${
                      platform === "anilist"
                        ? "bg-app-accent text-white shadow-md"
                        : "text-app-text-muted hover:text-app-text hover:bg-app-surface-hover hover:border-app-border"
                    }`}
                  >
                    <AniListIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="truncate">AniList</span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="username" className="block text-app-text-muted font-medium text-sm">
                    {platform === "mal" ? "MyAnimeList" : "AniList"} Username
                  </label>
                  <span className="text-[10px] text-app-text-faint font-medium flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> Public profiles only
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <div className="relative flex-1 w-full sm:w-auto">
                  <input
                    type="text"
                    id="username"
                    disabled={isLoading}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={platform === "mal" ? "e.g., Kev, Joseph, shroud, etc." : "e.g., anilist_user"}
                    className="w-full bg-app-bg/80 text-app-text placeholder-app-text-faint border border-app-border focus:border-app-accent rounded-xl px-4 h-[46px] text-sm focus:outline-none transition-colors duration-200"
                  />
                  {error && (
                    <p className="text-rose-400 text-xs font-mono flex items-center gap-1 mt-1.5">
                      <span>●</span> {error}
                    </p>
                  )}
                </div>

                {/* Mode Selector */}
                <div className="flex bg-app-surface/50 p-1 rounded-xl border border-app-border h-[46px] w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setType("anime")}
                    className={`flex-1 px-5 h-full rounded-lg text-xs font-semibold font-mono transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      type === "anime"
                        ? "bg-app-accent text-white shadow-sm"
                        : "text-app-text-muted hover:text-app-text hover:bg-app-surface"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Anime List
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setType("manga")}
                    className={`flex-1 px-5 h-full rounded-lg text-xs font-semibold font-mono transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      type === "manga"
                        ? "bg-app-accent text-white shadow-sm"
                        : "text-app-text-muted hover:text-app-text hover:bg-app-surface"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Manga List
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-app-accent hover:bg-app-accent-hover disabled:bg-app-surface disabled:text-app-text-faint text-white font-mono font-semibold px-6 h-[46px] rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-app-accent/20 active:scale-95 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-app-text-faint" />
                      <span className="text-app-text-faint">SCRAPING...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white text-white" />
                      Scrape List
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Quick Demo Suggestions */}
          {!isLoading && (
            <div className="flex flex-wrap items-center gap-2 text-xs mt-4">
              <span className="text-app-text-faint font-mono">Example Profile:</span>
              <button
                onClick={() => handleDemoClick("grimjow22", "anilist")}
                className="bg-app-bg hover:bg-app-surface-hover text-app-text-muted hover:text-app-accent border border-app-border px-2.5 py-1 rounded-md font-mono transition-colors duration-150 cursor-pointer"
              >
                grimjow22
              </button>
              <span className="text-app-text-faint flex items-center gap-1 ml-1 cursor-help" title="Click to view example data">
                <HelpCircle className="w-3 h-3" /> Click to view example
              </span>
            </div>
          )}

          {/* Progress Section */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-app-accent animate-pulse">EXECUTING SCRAPE CYCLE</span>
                  <span className="text-app-text-muted font-bold">{Math.round(currentProgress)}%</span>
                </div>
                <div className="w-full bg-app-bg h-3.5 rounded-full border border-app-border p-0.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-app-accent rounded-full"
                    animate={{ width: `${currentProgress}%` }}
                    transition={{ type: "spring", stiffness: 60 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Log Screen Console */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-app-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-app-text-muted" /> Output Terminal
              </span>
            </div>
            <div className="bg-app-bg border border-app-border rounded-xl p-4 h-48 overflow-y-auto font-mono text-xs text-app-text-muted space-y-1.5 scrollbar-thin scrollbar-thumb-app-border-strong scrollbar-track-transparent">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-app-text-faint">
                  <span>Awaiting execution parameters...</span>
                </div>
              ) : (
                logs.map((log, index) => {
                  let badgeColor = "text-app-accent";
                  if (log.type === "success") badgeColor = "text-emerald-400";
                  if (log.type === "error") badgeColor = "text-rose-400";
                  if (log.type === "warning") badgeColor = "text-amber-400";

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2 select-text"
                    >
                      <span className="text-app-text-faint shrink-0 font-bold">[{log.timestamp}]</span>
                      <span className={`${badgeColor} shrink-0 font-semibold`}>
                        {log.type === "success"
                          ? "[ OK ]"
                          : log.type === "error"
                          ? "[FAIL]"
                          : log.type === "warning"
                          ? "[WARN]"
                          : "[INFO]"}
                      </span>
                      <span className="break-all whitespace-pre-wrap">{log.message}</span>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
