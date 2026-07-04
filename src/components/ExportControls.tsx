import React, { useState } from "react";
import { Download, FileText, Clipboard, Check, Share2, FileSpreadsheet, FileJson, Database, FileCode, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RawAnimeItem, RawMangaItem, ListType } from "../types";
import { PlatformType } from "./ScrapeConsole";

interface ExportControlsProps {
  animeList: RawAnimeItem[];
  mangaList: RawMangaItem[];
  currentType: ListType;
  username: string;
  platform: PlatformType;
  nameLanguage: "romaji" | "english";
}

const NotionIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
  >
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
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

export default function ExportControls({
  animeList,
  mangaList,
  currentType,
  username,
  platform,
  nameLanguage,
}: ExportControlsProps) {
  const [copied, setCopied] = useState(false);

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

  // 1. Download CSV
  const downloadCSV = () => {
    if (activeList.length === 0) return;

    let headers = [];
    let rows = [];

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
      rows = activeList.map((item: any) => [
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
      rows = activeList.map((item: any) => [
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
  const downloadNotionCSV = () => {
    if (activeList.length === 0) return;

    // Notion maps: Name (Title), Status (Select), Score (Number), Progress (Number), Total (Number), Cover (Files & media), Format (Select), Link (URL)
    let headers = ["Name", "Status", "Score", "Progress", "Total", "Cover", "Format", "Link"];
    let rows = [];

    if (currentType === "anime") {
      rows = activeList.map((item: any) => [
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
      rows = activeList.map((item: any) => [
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
  const downloadJSON = () => {
    if (activeList.length === 0) return;
    const jsonString = JSON.stringify(activeList, null, 2);
    triggerDownload(jsonString, "application/json;charset=utf-8;", `${platform}_scraped_${username}_${currentType}.json`);
  };

  // 2.2 Download Mihon/Tachiyomi Tracking Sync (Manga Only)
  const downloadMihonSync = () => {
    if (activeList.length === 0 || currentType !== "manga") return;
    
    const syncData = activeList.map((item: any) => ({
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
  const downloadXML = () => {
    if (activeList.length === 0) return;

    const dt = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateFormatted = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;

    let xmlContent = `<?xml version="1.0" encoding="UTF-8" ?>\n`;
    xmlContent += `<!--\n Created by ${platform === 'mal' ? 'MAL' : 'AniList'} Scraper Engine\n Version 1.1.0\n-->\n`;
    xmlContent += `<myanimelist>\n`;
    xmlContent += `\t<myinfo>\n`;
    xmlContent += `\t\t<user_id>0</user_id>\n`;
    xmlContent += `\t\t<user_name><![CDATA[${username}]]></user_name>\n`;

    if (currentType === "anime") {
      xmlContent += `\t\t<user_export_type>1</user_export_type>\n`;
      xmlContent += `\t\t<user_total_anime>${activeList.length}</user_total_anime>\n`;
      xmlContent += `\t\t<user_total_watching>${activeList.filter((i) => i.status === 1).length}</user_total_watching>\n`;
      xmlContent += `\t\t<user_total_completed>${activeList.filter((i) => i.status === 2).length}</user_total_completed>\n`;
      xmlContent += `\t\t<user_total_onhold>${activeList.filter((i) => i.status === 3).length}</user_total_onhold>\n`;
      xmlContent += `\t\t<user_total_dropped>${activeList.filter((i) => i.status === 4).length}</user_total_dropped>\n`;
      xmlContent += `\t\t<user_total_plantowatch>${activeList.filter((i) => i.status === 6).length}</user_total_plantowatch>\n`;
    } else {
      xmlContent += `\t\t<user_export_type>2</user_export_type>\n`;
      xmlContent += `\t\t<user_total_manga>${activeList.length}</user_total_manga>\n`;
      xmlContent += `\t\t<user_total_reading>${activeList.filter((i) => i.status === 1).length}</user_total_reading>\n`;
      xmlContent += `\t\t<user_total_completed>${activeList.filter((i) => i.status === 2).length}</user_total_completed>\n`;
      xmlContent += `\t\t<user_total_onhold>${activeList.filter((i) => i.status === 3).length}</user_total_onhold>\n`;
      xmlContent += `\t\t<user_total_dropped>${activeList.filter((i) => i.status === 4).length}</user_total_dropped>\n`;
      xmlContent += `\t\t<user_total_plantoread>${activeList.filter((i) => i.status === 6).length}</user_total_plantoread>\n`;
    }
    xmlContent += `\t</myinfo>\n`;

    if (currentType === "anime") {
      activeList.forEach((item: any) => {
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
        xmlContent += `\t\t<update_on_import>1</update_on_import>\n`;
        xmlContent += `\t</anime>\n`;
      });
    } else {
      activeList.forEach((item: any) => {
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
        xmlContent += `\t\t<update_on_import>1</update_on_import>\n`;
        xmlContent += `\t</manga>\n`;
      });
    }
    
    xmlContent += `</myanimelist>\n`;

    triggerDownload(xmlContent, "text/xml;charset=utf-8;", `${platform}_export_${username}_${currentType}.xml`);
  };

  // 3. Download TXT Text Summary report
  const downloadTXT = () => {
    if (activeList.length === 0) return;

    const dateStr = new Date().toLocaleDateString();
    let textContent = `==================================================\n`;
    textContent += `${platform === 'mal' ? 'MYANIMELIST' : 'ANILIST'} PROFILE REPORT: ${username.toUpperCase()}\n`;
    textContent += `Export Type: ${currentType.toUpperCase()} | Generated: ${dateStr}\n`;
    textContent += `==================================================\n\n`;

    const scores = activeList.filter(item => item.score > 0).map(item => item.score);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : "N/A";

    textContent += `SUMMARY METRICS:\n`;
    textContent += `------------------\n`;
    textContent += `Total Saved Entries: ${activeList.length}\n`;
    textContent += `Average Scored Rating: ${avgScore}★\n`;
    textContent += `Completed Count: ${activeList.filter(item => item.status === 2).length}\n`;
    textContent += `Plan to ${currentType === "anime" ? "Watch" : "Read"} Count: ${activeList.filter(item => item.status === 6).length}\n\n`;

    textContent += `${currentType.toUpperCase()} LIST ITEMS:\n`;
    textContent += `------------------\n`;

    activeList.forEach((item: any, idx) => {
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
  const copyMarkdownToClipboard = () => {
    if (activeList.length === 0) return;

    const scores = activeList.filter(item => item.score > 0).map(item => item.score);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : "N/A";

    // Grab top 10 highest-rated items
    const topRated = [...activeList]
      .filter((item: any) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const platformName = platform === 'mal' ? 'MyAnimeList' : 'AniList';
    const profileUrl = platform === 'mal' ? `https://myanimelist.net/profile/${username}` : `https://anilist.co/user/${username}`;
    
    let md = `### [${platformName}](${platform === 'mal' ? "https://myanimelist.net" : "https://anilist.co"}) profile for [${username}](${profileUrl})\n`;
    md += `* **Scrape Type:** ${currentType === "anime" ? "Anime List" : "Manga List"}\n`;
    md += `* **Total Entries:** ${activeList.length} items\n`;
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

  return (
    <div id="export-controls-root" className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="text-app-text font-semibold text-sm flex items-center gap-2">
          <Share2 className="w-4 h-4 text-app-accent" /> Export Data & Downloads
        </h5>
      </div>
      
      <p className="text-app-text-muted text-xs leading-relaxed">
        Save your scraped {platform === 'mal' ? 'MyAnimeList' : 'AniList'} database directly to your machine. Choose between spreadsheet-compatible formats or generate markdown report cards to post on social communities.
      </p>

      <div className="flex flex-wrap gap-3 pt-2">
        {/* CSV Button */}
        <button
          onClick={downloadCSV}
          className="flex-1 min-w-[120px] bg-app-bg hover:bg-app-surface-hover text-app-text-muted hover:text-app-heading border border-app-border hover:border-app-border px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-mono font-medium transition-all duration-150 cursor-pointer hover:shadow-md"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-app-accent" />
          CSV
        </button>

        {/* JSON Button */}
        <button
          onClick={downloadJSON}
          className="flex-1 min-w-[120px] bg-app-bg hover:bg-app-surface-hover text-app-text-muted hover:text-app-heading border border-app-border hover:border-app-border px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-mono font-medium transition-all duration-150 cursor-pointer hover:shadow-md"
        >
          <FileJson className="w-3.5 h-3.5 text-app-accent" />
          JSON
        </button>

        {/* Notion CSV Button */}
        <button
          onClick={downloadNotionCSV}
          className="flex-1 min-w-[120px] bg-app-bg hover:bg-app-surface-hover text-app-text-muted hover:text-app-heading border border-app-border hover:border-app-border px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-[11px] sm:text-xs font-mono font-medium transition-all duration-150 cursor-pointer hover:shadow-md"
          title="Export CSV mapped specifically for Notion Databases"
        >
          <NotionIcon className="w-3.5 h-3.5 text-app-accent" />
          Notion CSV
        </button>

        {/* XML Button */}
        <button
          onClick={downloadXML}
          className="flex-1 min-w-[120px] bg-app-bg hover:bg-app-surface-hover text-app-text-muted hover:text-app-heading border border-app-border hover:border-app-border px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-[11px] sm:text-xs font-mono font-medium transition-all duration-150 cursor-pointer hover:shadow-md"
          title="MAL/AniList Migration XML (Standard MyAnimeList XML)"
        >
          <FileCode className="w-3.5 h-3.5 text-app-accent" />
          Native XML
        </button>

        {/* Mihon Sync Button (Manga Only) */}
        {currentType === "manga" && (
          <button
            onClick={downloadMihonSync}
            className="flex-1 min-w-[120px] bg-app-bg hover:bg-app-surface-hover text-app-text-muted hover:text-app-heading border border-app-border hover:border-app-border px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-[11px] sm:text-xs font-mono font-medium transition-all duration-150 cursor-pointer hover:shadow-md"
            title="Mihon/Tachiyomi Tracker Mapping JSON"
          >
            <MihonIcon className="w-3.5 h-3.5 text-app-accent" />
            Mihon Sync
          </button>
        )}

        {/* Text Report Button */}
        <button
          onClick={downloadTXT}
          className="flex-1 min-w-[120px] bg-app-bg hover:bg-app-surface-hover text-app-text-muted hover:text-app-heading border border-app-border hover:border-app-border px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-mono font-medium transition-all duration-150 cursor-pointer hover:shadow-md"
        >
          <FileText className="w-3.5 h-3.5 text-app-accent" />
          TXT Report
        </button>

        {/* Copy Markdown Button */}
        <button
          onClick={copyMarkdownToClipboard}
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
      </div>
    </div>
  );
}
