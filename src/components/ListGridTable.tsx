import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  Grid, 
  List, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ExternalLink, 
  Filter, 
  Star, 
  Tv, 
  BookOpen 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RawAnimeItem, RawMangaItem, ListType } from "../types";
import { PlatformType } from "./ScrapeConsole";

interface ListGridTableProps {
  animeList: RawAnimeItem[];
  mangaList: RawMangaItem[];
  currentType: ListType;
  platform: PlatformType;
  nameLanguage: "romaji" | "english";
  setNameLanguage: React.Dispatch<React.SetStateAction<"romaji" | "english">>;
}

export default function ListGridTable({
  animeList,
  mangaList,
  currentType,
  platform,
  nameLanguage,
  setNameLanguage,
}: ListGridTableProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null); // null = All
  const [selectedMediaType, setSelectedMediaType] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("score-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);

  // Status Labels & Values
  // 1 = Watching/Reading, 2 = Completed, 3 = On Hold, 4 = Dropped, 6 = Plan to Watch/Read
  const statusFilters = useMemo(() => {
    const list = currentType === "anime" ? animeList : mangaList;
    const counts = {
      all: list.length,
      watching: list.filter(item => item.status === 1).length,
      completed: list.filter(item => item.status === 2).length,
      onHold: list.filter(item => item.status === 3).length,
      dropped: list.filter(item => item.status === 4).length,
      planned: list.filter(item => item.status === 6).length,
    };

    return [
      { label: "All", value: null, count: counts.all },
      { 
        label: currentType === "anime" ? "Watching" : "Reading", 
        value: 1, 
        count: currentType === "anime" ? counts.watching : counts.watching 
      },
      { label: "Completed", value: 2, count: counts.completed },
      { label: "On Hold", value: 3, count: counts.onHold },
      { label: "Dropped", value: 4, count: counts.dropped },
      { 
        label: currentType === "anime" ? "Plan to Watch" : "Plan to Read", 
        value: 6, 
        count: counts.planned 
      },
    ];
  }, [animeList, mangaList, currentType]);

  // Media Type Options
  const mediaTypeOptions = useMemo(() => {
    const list = currentType === "anime" ? animeList : mangaList;
    const set = new Set<string>();
    list.forEach((item: any) => {
      const typeStr = currentType === "anime" 
        ? item.anime_media_type_string 
        : item.manga_media_type_string;
      if (typeStr) set.add(typeStr);
    });
    return ["All", ...Array.from(set)];
  }, [animeList, mangaList, currentType]);

  // Status styles mapping
  const statusBadgeStyle = (statusVal: number) => {
    switch (statusVal) {
      case 2: // Completed
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case 1: // Watching / Reading
        return "bg-indigo-500/10 text-app-accent border-app-accent/20";
      case 3: // On Hold
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case 4: // Dropped
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case 6: // Planned
        return "bg-app-text-muted/10 text-app-text-muted border-app-border/50";
      default:
        return "bg-app-text-muted/10 text-app-text-muted border-app-border/50";
    }
  };

  const statusText = (statusVal: number) => {
    switch (statusVal) {
      case 2: return "Completed";
      case 1: return currentType === "anime" ? "Watching" : "Reading";
      case 3: return "On Hold";
      case 4: return "Dropped";
      case 6: return currentType === "anime" ? "Plan to Watch" : "Plan to Read";
      default: return "Unknown";
    }
  };

  // Filter & Sort Logic
  const getTitle = (item: any) => {
    if (currentType === "anime") {
      const eng = item.anime_title_eng;
      return nameLanguage === "english" && eng ? eng : item.anime_title;
    } else {
      const eng = item.manga_title_eng || item.manga_english;
      return nameLanguage === "english" && eng ? eng : item.manga_title;
    }
  };

  const processedList = useMemo(() => {
    const list = currentType === "anime" ? animeList : mangaList;
    
    let filtered = list.filter((item: any) => {
      // 1. Search Query
      const title = getTitle(item);
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Status Select
      const matchesStatus = selectedStatus === null || item.status === selectedStatus;
      
      // 3. Media Type Select
      const mType = currentType === "anime" ? item.anime_media_type_string : item.manga_media_type_string;
      const matchesMediaType = selectedMediaType === "All" || mType === selectedMediaType;

      return matchesSearch && matchesStatus && matchesMediaType;
    });

    // Sort Logic
    filtered.sort((a: any, b: any) => {
      const titleA = getTitle(a);
      const titleB = getTitle(b);

      switch (sortBy) {
        case "title-asc":
          return titleA.localeCompare(titleB);
        case "title-desc":
          return titleB.localeCompare(titleA);
        case "score-desc":
          return b.score - a.score || titleA.localeCompare(titleB);
        case "score-asc":
          return a.score - b.score || titleA.localeCompare(titleB);
        case "progress-desc": {
          const progA = currentType === "anime" ? a.num_watched_episodes : a.num_read_chapters;
          const progB = currentType === "anime" ? b.num_watched_episodes : b.num_read_chapters;
          return progB - progA;
        }
        case "progress-asc": {
          const progA = currentType === "anime" ? a.num_watched_episodes : a.num_read_chapters;
          const progB = currentType === "anime" ? b.num_watched_episodes : b.num_read_chapters;
          return progA - progB;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [animeList, mangaList, currentType, searchQuery, selectedStatus, selectedMediaType, sortBy, nameLanguage]);

  // Pagination bounds
  const totalPages = Math.max(Math.ceil(processedList.length / itemsPerPage), 1);
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedList.slice(start, start + itemsPerPage);
  }, [processedList, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleStatusFilterChange = (status: number | null) => {
    setSelectedStatus(status);
    setCurrentPage(1); // reset to first page
  };

  return (
    <div id="list-grid-table-root" className="space-y-6">
      
      {/* 1. Header Toolbar Filter/Search Strip */}
      <div className="bg-app-surface border border-app-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-faint" />
            <input
              type="text"
              placeholder={`Search scraped ${currentType} list...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-app-bg text-app-text placeholder-app-text-faint border border-app-border rounded-xl pl-10 pr-4 h-[38px] text-sm focus:outline-none focus:border-app-accent transition-colors duration-200"
            />
          </div>

          {/* Filtering dropdowns & layout toggler */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            
            {/* Format Filter */}
            <div className="relative flex items-center bg-app-bg h-[38px] rounded-xl border border-app-border focus-within:border-app-accent transition-colors grow sm:grow-0">
              <div className="pl-3 pr-2 flex items-center pointer-events-none text-app-text-faint">
                <Filter className="w-3.5 h-3.5" />
              </div>
              <select
                value={selectedMediaType}
                onChange={(e) => {
                  setSelectedMediaType(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-transparent text-app-text-muted text-xs font-medium focus:outline-none cursor-pointer pr-8 h-full w-full outline-none"
              >
                <option value="All" className="bg-app-bg text-app-text-muted">All Formats</option>
                {mediaTypeOptions.filter(o => o !== "All").map((opt) => (
                  <option key={opt} value={opt} className="bg-app-bg text-app-text-muted">{opt.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <div className="absolute right-3 pointer-events-none text-app-text-faint">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex items-center bg-app-bg h-[38px] rounded-xl border border-app-border focus-within:border-app-accent transition-colors grow sm:grow-0">
              <div className="pl-3 pr-2 flex items-center pointer-events-none text-app-text-faint">
                <span className="text-[10px] font-mono">SORT:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-transparent text-app-text-muted text-xs font-medium focus:outline-none cursor-pointer pr-8 h-full w-full outline-none"
              >
                <option value="score-desc" className="bg-app-bg">Highest Score</option>
                <option value="score-asc" className="bg-app-bg">Lowest Score</option>
                <option value="title-asc" className="bg-app-bg">Title (A-Z)</option>
                <option value="title-desc" className="bg-app-bg">Title (Z-A)</option>
                <option value="progress-desc" className="bg-app-bg">Highest Progress</option>
                <option value="progress-asc" className="bg-app-bg">Lowest Progress</option>
              </select>
              <div className="absolute right-3 pointer-events-none text-app-text-faint">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center bg-app-bg p-1 h-[38px] rounded-xl border border-app-border shrink-0 grow sm:grow-0">
              <button
                onClick={() => setNameLanguage("romaji")}
                className={`flex-1 px-3 h-full rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer focus:outline-none ${
                  nameLanguage === "romaji" 
                    ? "bg-app-surface text-app-heading shadow-sm" 
                    : "text-app-text-faint hover:text-app-text-muted"
                }`}
              >
                JP
              </button>
              <button
                onClick={() => setNameLanguage("english")}
                className={`flex-1 px-3 h-full rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer focus:outline-none ${
                  nameLanguage === "english" 
                    ? "bg-app-surface text-app-heading shadow-sm" 
                    : "text-app-text-faint hover:text-app-text-muted"
                }`}
              >
                EN
              </button>
            </div>

            {/* View Grid/Table Toggle */}
            <div className="flex items-center bg-app-bg p-1 h-[38px] rounded-xl border border-app-border shrink-0 grow sm:grow-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex-1 px-2.5 h-full rounded-lg flex items-center justify-center transition-colors cursor-pointer focus:outline-none ${
                  viewMode === "grid" 
                    ? "bg-app-surface text-app-heading shadow-sm" 
                    : "text-app-text-faint hover:text-app-text-muted"
                }`}
                title="Grid Cover View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex-1 px-2.5 h-full rounded-lg flex items-center justify-center transition-colors cursor-pointer focus:outline-none ${
                  viewMode === "table" 
                    ? "bg-app-surface text-app-heading shadow-sm" 
                    : "text-app-text-faint hover:text-app-text-muted"
                }`}
                title="Table Dense View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Tab Strip */}
        <div className="flex flex-wrap items-center md:justify-center gap-1.5 border-t border-app-border/60 pt-4">
          {statusFilters.map((tab) => (
            <button
              key={tab.label}
              onClick={() => handleStatusFilterChange(tab.value)}
              className={`flex-1 sm:flex-none flex items-center justify-center px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap border ${
                selectedStatus === tab.value
                  ? "bg-app-accent text-white border-app-accent shadow-md shadow-indigo-600/10 font-semibold"
                  : "bg-app-bg/50 hover:bg-app-surface-hover text-app-text-muted hover:text-app-text border-transparent"
              }`}
            >
              {tab.label} <span className="opacity-50 text-[10px] font-mono font-bold ml-1">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. List Representation Stage */}
      {processedList.length === 0 ? (
        <div className="bg-app-surface border border-app-border rounded-2xl py-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-app-bg flex items-center justify-center text-app-text-faint mx-auto border border-app-border">
            <Search className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-app-text-muted">No results match your search or filter options.</p>
          <button 
            onClick={() => {
              setSearchQuery(""); 
              setSelectedStatus(null); 
              setSelectedMediaType("All");
            }}
            className="text-xs text-app-accent hover:text-indigo-300 font-semibold transition-colors duration-150 underline decoration-indigo-400/30 underline-offset-4"
          >
            Reset Active Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        
        /* GRID VIEW LAYOUT */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          <AnimatePresence mode="popLayout">
            {paginatedList.map((item: any, idx) => {
              const title = getTitle(item);
              const imgPath = currentType === "anime" ? item.anime_image_path : item.manga_image_path;
              const unitCount = currentType === "anime" ? item.anime_num_episodes : (item.manga_num_chapters || 0);
              const progress = currentType === "anime" ? item.num_watched_episodes : item.num_read_chapters;
              const mType = currentType === "anime" ? item.anime_media_type_string : item.manga_media_type_string;
              const malId = currentType === "anime" ? item.anime_id : item.manga_id;
              const anilistId = item.anilist_id;
              
              const malHref = (platform === 'anilist' && malId === anilistId) 
                ? `https://myanimelist.net/${currentType}.php?q=${encodeURIComponent(title)}` 
                : `https://myanimelist.net/${currentType}/${malId}`;
                
              const anilistHref = (platform === 'anilist' && anilistId)
                ? `https://anilist.co/${currentType}/${anilistId}`
                : `https://anilist.co/search/${currentType}?search=${encodeURIComponent(title)}`;
              
              // Completion percentage
              const percent = unitCount > 0 ? Math.min(Math.round((progress / unitCount) * 100), 100) : 0;

              return (
                <motion.div
                  key={malId}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: (idx % 12) * 0.01 }}
                  className="bg-app-surface border border-app-border hover:border-app-border-strong rounded-xl overflow-hidden shadow-sm hover:shadow-lg flex flex-col justify-between group transition-all duration-250 relative"
                >
                  {/* Top image block */}
                  <div className="relative aspect-[3/4] bg-app-bg overflow-hidden w-full">
                    {item.score > 0 && (
                      <div className="absolute top-2.5 right-2.5 bg-app-bg/85 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold font-mono text-amber-400 border border-amber-500/20 flex items-center gap-0.5 z-10 shadow-sm">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                        {item.score}
                      </div>
                    )}
                    <img
                      src={imgPath}
                      alt={title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                      loading="lazy"
                    />
                    {/* Dark overlay on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-end pb-4 gap-2">
                      <a
                        href={malHref}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-semibold text-white bg-app-accent/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/10 flex items-center justify-center gap-1 hover:bg-app-accent shadow-sm w-[85%]"
                      >
                        MAL Profile <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <a
                        href={anilistHref}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-semibold text-white bg-app-accent/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/10 flex items-center justify-center gap-1 hover:bg-app-accent shadow-sm w-[85%]"
                      >
                        AniList Profile <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* Metadata Details Bottom block */}
                  <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Format badge & Type */}
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-app-text-faint uppercase tracking-wider mb-1.5">
                        {currentType === "anime" ? <Tv className="w-2.5 h-2.5 text-app-accent" /> : <BookOpen className="w-2.5 h-2.5 text-app-accent" />}
                        <span>{mType ? mType.replace(/_/g, ' ') : "Other"}</span>
                      </div>
                      
                      {/* Title */}
                      <h6 
                        className="text-app-text font-medium text-xs line-clamp-2 hover:text-app-accent transition-colors duration-150 pr-1 cursor-help"
                        title={title}
                      >
                        {title}
                      </h6>
                    </div>

                    {/* Progress tracking display */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-[10px] font-mono text-app-text-muted">
                        <span>
                          {currentType === "anime" ? "Episodes:" : "Chapters:"}
                        </span>
                        <span className="font-bold text-app-text">
                          {progress} / {unitCount > 0 ? unitCount : "?"}
                        </span>
                      </div>
                      
                      {/* Tiny progression bar */}
                      <div className="w-full bg-app-bg h-1.5 rounded-full overflow-hidden border border-app-border/50">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${unitCount > 0 ? percent : 10}%` }}
                        />
                      </div>

                      {/* Status Badging */}
                      <div className="flex items-center justify-between pt-1 text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-semibold tracking-wider uppercase ${statusBadgeStyle(item.status)}`}>
                          {statusText(item.status)}
                        </span>
                        {item.is_rewatching === 1 && (
                          <span className="text-[9px] text-app-accent font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded-md border border-app-accent/10">REWATCH</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        
        /* TABLE Dense View */
        <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-app-bg border-b border-app-border text-app-text-muted text-[10px] font-mono uppercase tracking-wider">
                <th className="py-4 px-5">Media</th>
                <th className="py-4 px-4">Title</th>
                <th className="py-4 px-4 text-center">Score</th>
                <th className="py-4 px-4 text-center">Type</th>
                <th className="py-4 px-4 text-center">Progress</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-5 text-right">Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border text-sm">
              <AnimatePresence mode="popLayout">
                {paginatedList.map((item: any, idx) => {
                  const title = getTitle(item);
                  const imgPath = currentType === "anime" ? item.anime_image_path : item.manga_image_path;
                  const unitCount = currentType === "anime" ? item.anime_num_episodes : (item.manga_num_chapters || 0);
                  const progress = currentType === "anime" ? item.num_watched_episodes : item.num_read_chapters;
                  const mType = currentType === "anime" ? item.anime_media_type_string : item.manga_media_type_string;
                  const malId = currentType === "anime" ? item.anime_id : item.manga_id;
                  const anilistId = item.anilist_id;
                  
                  const malHref = (platform === 'anilist' && malId === anilistId) 
                    ? `https://myanimelist.net/${currentType}.php?q=${encodeURIComponent(title)}` 
                    : `https://myanimelist.net/${currentType}/${malId}`;
                    
                  const anilistHref = (platform === 'anilist' && anilistId)
                    ? `https://anilist.co/${currentType}/${anilistId}`
                    : `https://anilist.co/search/${currentType}?search=${encodeURIComponent(title)}`;

                  return (
                    <motion.tr
                      key={malId}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15, delay: (idx % 15) * 0.01 }}
                      className="hover:bg-app-bg/40 transition-colors duration-150 text-app-text-muted text-xs"
                    >
                      {/* Media image col */}
                      <td className="py-2.5 px-5 shrink-0">
                        <div className="w-9 h-12 bg-app-bg rounded overflow-hidden border border-app-border relative shadow-sm">
                          <img
                            src={imgPath}
                            alt={title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </td>

                      {/* Title col */}
                      <td className="py-2.5 px-4 font-medium max-w-[320px]">
                        <div className="flex flex-col">
                          <span className="text-app-text text-xs font-semibold hover:text-app-accent transition-colors duration-150 line-clamp-1 truncate" title={title}>
                            {title}
                          </span>
                          <span className="text-[10px] text-app-text-faint font-mono mt-0.5">ID: {malId}</span>
                        </div>
                      </td>

                      {/* Score col */}
                      <td className="py-2.5 px-4 text-center">
                        {item.score > 0 ? (
                          <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/15 inline-flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {item.score}
                          </span>
                        ) : (
                          <span className="text-app-text-faint font-mono">-</span>
                        )}
                      </td>

                      {/* Type col */}
                      <td className="py-2.5 px-4 text-center font-mono font-medium text-app-text-muted uppercase tracking-wider text-[10px]">
                        {mType ? mType.replace(/_/g, ' ') : "Other"}
                      </td>

                      {/* Progress col */}
                      <td className="py-2.5 px-4 text-center font-mono">
                        <span className="text-app-text font-bold">{progress}</span>
                        <span className="text-app-text-faint"> / {unitCount > 0 ? unitCount : "?"}</span>
                      </td>

                      {/* Status col */}
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-semibold uppercase tracking-wider inline-block ${statusBadgeStyle(item.status)}`}>
                          {statusText(item.status)}
                        </span>
                      </td>

                      {/* Links external profile */}
                      <td className="py-2.5 px-5 text-right space-x-1 whitespace-nowrap">
                        <a
                          href={malHref}
                          target="_blank"
                          rel="noreferrer"
                          className="text-app-text-muted hover:text-app-accent transition-colors duration-150 p-1 hover:bg-app-bg border border-transparent hover:border-app-border rounded-md inline-block"
                          title="View on MyAnimeList"
                        >
                          <span className="text-[10px] font-bold tracking-tighter">MAL</span>
                        </a>
                        <a
                          href={anilistHref}
                          target="_blank"
                          rel="noreferrer"
                          className="text-app-text-muted hover:text-app-accent transition-colors duration-150 p-1 hover:bg-app-bg border border-transparent hover:border-app-border rounded-md inline-block"
                          title="View on AniList"
                        >
                          <span className="text-[10px] font-bold tracking-tighter">AL</span>
                        </a>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Pagination Controls Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-app-surface border border-app-border rounded-2xl px-6 py-4">
        <div className="text-xs font-mono text-app-text-muted">
          Showing <span className="font-bold text-app-text">{Math.min((currentPage - 1) * itemsPerPage + 1, processedList.length)}</span> to{" "}
          <span className="font-bold text-app-text">{Math.min(currentPage * itemsPerPage, processedList.length)}</span> of{" "}
          <span className="font-bold text-app-text">{processedList.length}</span> entries
        </div>

        {/* Dynamic page buttons */}
        <div className="flex flex-wrap justify-center items-center gap-2">
          
          {/* Items per page selector */}
          <div className="flex items-center gap-1.5 sm:mr-2">
            <span className="text-[10px] font-mono text-app-text-faint whitespace-nowrap">Per Page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-app-bg text-app-text-muted text-xs border border-app-border px-2 py-1 rounded-lg focus:outline-none focus:border-app-accent cursor-pointer"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
              <option value={96}>96</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-app-bg hover:bg-app-surface-hover disabled:bg-app-surface disabled:text-app-text-faint hover:text-app-accent border border-app-border disabled:border-app-border/40 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Simple numeric indication */}
            <span className="text-xs font-mono text-app-text-muted px-3 py-1 bg-app-bg rounded-lg border border-app-border whitespace-nowrap">
              Page <span className="text-app-accent font-bold">{currentPage}</span> of {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-app-bg hover:bg-app-surface-hover disabled:bg-app-surface disabled:text-app-text-faint hover:text-app-accent border border-app-border disabled:border-app-border/40 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
