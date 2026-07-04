import React, { useMemo, useState } from "react";
import { 
  BarChart2, 
  PieChart, 
  Tv, 
  Award, 
  Calendar, 
  Clock, 
  CheckCircle, 
  BookOpen 
} from "lucide-react";
import { motion } from "motion/react";
import { RawAnimeItem, RawMangaItem, UserProfile, ListStats } from "../types";
import ActivityHeatmap from "./ActivityHeatmap";

interface StatsSectionProps {
  animeList: RawAnimeItem[];
  mangaList: RawMangaItem[];
  currentType: "anime" | "manga";
  profile: UserProfile | null;
  theme: "light" | "dark";
}

export default function StatsSection({
  animeList,
  mangaList,
  currentType,
  profile,
  theme,
}: StatsSectionProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // 1. Calculate stats from list
  const stats = useMemo<ListStats>(() => {
    const list = currentType === "anime" ? animeList : mangaList;
    const total = list.length;
    
    let scoreSum = 0;
    let scoredCount = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let onHoldCount = 0;
    let droppedCount = 0;
    let plannedCount = 0;
    let totalUnits = 0;

    const mediaTypeCounts: Record<string, number> = {};
    const unitsByFormat: Record<string, number> = {};
    const scoreCounts: Record<number, number> = {
      10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };

    list.forEach((item: any) => {
      // Scores
      if (item.score > 0) {
        scoreSum += item.score;
        scoredCount++;
        scoreCounts[item.score] = (scoreCounts[item.score] || 0) + 1;
      }

      // Status
      // Status mapping: 1 = Watching/Reading, 2 = Completed, 3 = On Hold, 4 = Dropped, 6 = Plan to Watch/Read
      if (item.status === 2) completedCount++;
      else if (item.status === 1) inProgressCount++;
      else if (item.status === 3) onHoldCount++;
      else if (item.status === 4) droppedCount++;
      else if (item.status === 6) plannedCount++;

      // Units
      if (currentType === "anime") {
        totalUnits += item.num_watched_episodes || 0;
      } else {
        totalUnits += item.num_read_chapters || 0;
      }

      // Media types & Format Units
      const mediaType = currentType === "anime" 
        ? (item.anime_media_type_string || "Unknown")
        : (item.manga_media_type_string || "Unknown");
      mediaTypeCounts[mediaType] = (mediaTypeCounts[mediaType] || 0) + 1;
      
      const units = currentType === "anime" 
        ? (item.num_watched_episodes || 0)
        : (item.num_read_chapters || 0);
      unitsByFormat[mediaType] = (unitsByFormat[mediaType] || 0) + units;
    });

    const meanScore = scoredCount > 0 ? Number((scoreSum / scoredCount).toFixed(2)) : 0;

    return {
      total,
      meanScore,
      completedCount,
      inProgressCount,
      onHoldCount,
      droppedCount,
      plannedCount,
      totalUnits,
      mediaTypeCounts,
      unitsByFormat,
      scoreCounts,
    };
  }, [animeList, mangaList, currentType]);

  // Derived statistics helper
  const completionRate = stats.total > 0 
    ? Math.round((stats.completedCount / stats.total) * 100) 
    : 0;

  // Max score count for SVG scaling
  const maxScoreCount = useMemo(() => {
    return Math.max(...(Object.values(stats.scoreCounts) as number[]), 1);
  }, [stats.scoreCounts]);

  // Color mappings for modern aesthetic
  const statusColors = {
    completed: "bg-emerald-500 text-emerald-400 border-emerald-500/20",
    inProgress: "bg-indigo-500 text-app-accent border-app-accent/20",
    onHold: "bg-amber-500 text-amber-400 border-amber-500/20",
    dropped: "bg-rose-500 text-rose-400 border-rose-500/20",
    planned: "bg-app-text-muted text-app-text-muted border-app-border-strong",
  };

  const statusLabels = currentType === "anime" 
    ? { completed: "Completed", inProgress: "Watching", onHold: "On Hold", dropped: "Dropped", planned: "Plan to Watch" }
    : { completed: "Completed", inProgress: "Reading", onHold: "On Hold", dropped: "Dropped", planned: "Plan to Read" };

  return (
    <div id="stats-section-root" className="space-y-6">
      {/* 1. Quick Stats Banner Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Stat Item 1: Total Titles */}
        <div className="bg-app-surface border border-app-border rounded-2xl p-4 xl:p-5 shadow-sm flex flex-col xl:flex-row items-center text-center xl:text-left gap-3 xl:gap-4 hover:border-app-border-strong transition-colors">
          <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-app-accent shrink-0">
            {currentType === "anime" ? <Tv className="w-5 h-5 xl:w-6 xl:h-6" /> : <BookOpen className="w-5 h-5 xl:w-6 xl:h-6" />}
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-[10px] xl:text-xs font-mono text-app-text-faint uppercase leading-tight">Total Entries</p>
            <h4 className="text-xl xl:text-2xl font-bold font-mono text-app-text mt-0.5">{stats.total}</h4>
            <p className="text-[9px] xl:text-[10px] text-app-text-muted mt-0.5 truncate">Scraped from profile</p>
          </div>
        </div>

        {/* Stat Item 2: Mean Score */}
        <div className="bg-app-surface border border-app-border rounded-2xl p-4 xl:p-5 shadow-sm flex flex-col xl:flex-row items-center text-center xl:text-left gap-3 xl:gap-4 hover:border-app-border-strong transition-colors">
          <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
            <Award className="w-5 h-5 xl:w-6 xl:h-6" />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-[10px] xl:text-xs font-mono text-app-text-faint uppercase leading-tight">Mean Score</p>
            <h4 className="text-xl xl:text-2xl font-bold font-mono text-app-text mt-0.5">
              {stats.meanScore > 0 ? stats.meanScore : "N/A"}
            </h4>
            <p className="text-[9px] xl:text-[10px] text-app-text-muted mt-0.5 truncate">Excludes unrated</p>
          </div>
        </div>

        {/* Stat Item 3: Days Watched / Read */}
        <div className="bg-app-surface border border-app-border rounded-2xl p-4 xl:p-5 shadow-sm flex flex-col xl:flex-row items-center text-center xl:text-left gap-3 xl:gap-4 hover:border-app-border-strong transition-colors">
          <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <Clock className="w-5 h-5 xl:w-6 xl:h-6" />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-[10px] xl:text-xs font-mono text-app-text-faint uppercase leading-tight">
              {currentType === "anime" ? "Eps Watched" : "Chs Read"}
            </p>
            <h4 className="text-xl xl:text-2xl font-bold font-mono text-app-text mt-0.5">{stats.totalUnits}</h4>
            <p className="text-[9px] xl:text-[10px] text-app-text-muted mt-0.5 truncate">
              {currentType === "anime" 
                ? `~${Math.round((stats.totalUnits * 24) / 60)} hrs total` 
                : "Active units"}
            </p>
          </div>
        </div>

        {/* Stat Item 4: Completion Rate */}
        <div className="bg-app-surface border border-app-border rounded-2xl p-4 xl:p-5 shadow-sm flex flex-col xl:flex-row items-center text-center xl:text-left gap-3 xl:gap-4 hover:border-app-border-strong transition-colors">
          <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
            <CheckCircle className="w-5 h-5 xl:w-6 xl:h-6" />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-[10px] xl:text-xs font-mono text-app-text-faint uppercase leading-tight">Completion</p>
            <h4 className="text-xl xl:text-2xl font-bold font-mono text-app-text mt-0.5">{completionRate}%</h4>
            <p className="text-[9px] xl:text-[10px] text-app-text-muted mt-0.5 truncate">{stats.completedCount} items</p>
          </div>
        </div>
      </div>

      {/* 2. Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Score Distribution Chart */}
        <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-app-accent" />
              <h5 className="text-app-text font-semibold text-sm font-sans">Score Distribution</h5>
            </div>
            <span className="text-[10px] font-mono text-app-text-faint">Sorted by Score Desc</span>
          </div>

          {/* SVG Bar Chart */}
          <div className="relative w-full h-56 mt-2 flex flex-col justify-end">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
              {[1, 2, 3, 4].map((gridLine, idx) => (
                <div key={idx} className="w-full border-t border-app-border/60 h-0 text-[10px] font-mono text-app-text-faint flex justify-end pr-2 pt-1">
                  {Math.round((maxScoreCount / 4) * (4 - idx))}
                </div>
              ))}
            </div>

            {/* Custom SVG Bar Graph */}
            <div className="w-full h-44 flex items-end justify-between px-2 md:px-6 relative z-10">
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((score) => {
                const count = stats.scoreCounts[score] || 0;
                const percentage = maxScoreCount > 0 ? (count / maxScoreCount) * 100 : 0;
                return (
                  <div 
                    key={score} 
                    className="flex-1 flex flex-col items-center group relative h-full justify-end cursor-pointer px-1"
                    onMouseEnter={() => setHoveredBar(score)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Hover tooltip */}
                    {hoveredBar === score && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-app-bg text-app-text border border-app-border py-1 px-2.5 rounded text-[10px] font-mono z-20 shadow-md whitespace-nowrap">
                        Score {score}: <span className="text-app-accent font-bold">{count} titles</span>
                      </div>
                    )}
                    
                    {/* Animated Bar */}
                    <motion.div 
                      className={`w-full rounded-t-md transition-colors duration-150 ${
                        hoveredBar === score 
                          ? "bg-app-accent shadow-sm" 
                          : "bg-app-surface-hover group-hover:bg-app-accent/70"
                      }`}
                      initial={{ height: 0 }}
                      animate={{ height: `${percentage}%` }}
                      transition={{ type: "spring", stiffness: 50, delay: (10 - score) * 0.03 }}
                    />
                    
                    {/* Label */}
                    <span className="text-[10px] font-mono text-app-text-faint mt-2">{score}★</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Status Distribution Panel (Side-rail) */}
        <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <h5 className="text-app-text font-semibold text-sm font-sans">Status Segmentation</h5>
            </div>

            {/* Segment Progress Bars */}
            <div className="space-y-4">
              {/* Completed Row */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-app-text-muted font-medium flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    {statusLabels.completed}
                  </span>
                  <span className="text-app-text-muted font-mono">
                    {stats.completedCount} <span className="text-[10px] text-app-text-faint">({stats.total > 0 ? Math.round((stats.completedCount / stats.total) * 100) : 0}%)</span>
                  </span>
                </div>
                <div className="w-full bg-app-bg h-2 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-emerald-500" 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.total > 0 ? (stats.completedCount / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* In Progress Row */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-app-text-muted font-medium flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    {statusLabels.inProgress}
                  </span>
                  <span className="text-app-text-muted font-mono">
                    {stats.inProgressCount} <span className="text-[10px] text-app-text-faint">({stats.total > 0 ? Math.round((stats.inProgressCount / stats.total) * 100) : 0}%)</span>
                  </span>
                </div>
                <div className="w-full bg-app-bg h-2 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-indigo-500" 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.total > 0 ? (stats.inProgressCount / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* On Hold Row */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-app-text-muted font-medium flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    {statusLabels.onHold}
                  </span>
                  <span className="text-app-text-muted font-mono">
                    {stats.onHoldCount} <span className="text-[10px] text-app-text-faint">({stats.total > 0 ? Math.round((stats.onHoldCount / stats.total) * 100) : 0}%)</span>
                  </span>
                </div>
                <div className="w-full bg-app-bg h-2 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-amber-500" 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.total > 0 ? (stats.onHoldCount / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Dropped Row */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-app-text-muted font-medium flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    {statusLabels.dropped}
                  </span>
                  <span className="text-app-text-muted font-mono">
                    {stats.droppedCount} <span className="text-[10px] text-app-text-faint">({stats.total > 0 ? Math.round((stats.droppedCount / stats.total) * 100) : 0}%)</span>
                  </span>
                </div>
                <div className="w-full bg-app-bg h-2 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-rose-500" 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.total > 0 ? (stats.droppedCount / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Plan to Watch Row */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-app-text-muted font-medium flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-app-text-muted"></span>
                    {statusLabels.planned}
                  </span>
                  <span className="text-app-text-muted font-mono">
                    {stats.plannedCount} <span className="text-[10px] text-app-text-faint">({stats.total > 0 ? Math.round((stats.plannedCount / stats.total) * 100) : 0}%)</span>
                  </span>
                </div>
                <div className="w-full bg-app-bg h-2 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-app-text-muted" 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.total > 0 ? (stats.plannedCount / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-app-text-faint text-center mt-6 border-t border-app-border/80 pt-3">
            Active Filter Set: All Loaded
          </div>
        </div>

      </div>

      {/* 3. Format Breakdown (Tv/Movie counts etc.) */}
      <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm">
        <h5 className="text-app-text font-semibold text-sm font-sans mb-4 flex items-center justify-between">
          <span>Format / Medium Breakdown</span>
          {currentType === "manga" && (
            <span className="text-[10px] text-app-text-faint font-normal bg-app-bg px-2 py-1 rounded border border-app-border">
              Manhua/Manhwa high-volume categorization active
            </span>
          )}
        </h5>
        <div className="flex flex-wrap justify-center sm:justify-start gap-3 md:gap-4">
          {Object.entries(stats.mediaTypeCounts).map(([typeStr, count]) => {
            const pct = stats.total > 0 ? Math.round(((count as number) / stats.total) * 100) : 0;
            const units = stats.unitsByFormat[typeStr] || 0;
            return (
              <div key={typeStr} className="w-[calc(50%-6px)] sm:w-[150px] md:w-[160px] lg:w-[170px] bg-app-bg/40 border border-app-border/85 p-4 rounded-xl text-center space-y-1 relative group">
                <p className="text-xs font-mono text-app-text-faint truncate" title={typeStr}>{typeStr ? typeStr.replace(/_/g, ' ') : typeStr}</p>
                <h4 className="text-xl font-bold text-app-text font-mono">{count}</h4>
                <p className="text-[10px] font-mono text-app-accent">{pct}% share</p>
                {/* Tooltip for total units (e.g. chapters) to show volume distinction */}
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity -top-8 left-1/2 -translate-x-1/2 bg-app-surface border border-app-border px-2 py-1 rounded shadow-md text-[10px] text-app-text-muted whitespace-nowrap pointer-events-none z-10">
                  Total {currentType === "anime" ? "Eps" : "Chs"}: <span className="font-bold text-app-text">{units.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
          {Object.keys(stats.mediaTypeCounts).length === 0 && (
            <div className="col-span-full py-4 text-center font-mono text-xs text-app-text-faint">
              No format data found.
            </div>
          )}
        </div>
      </div>
      
      {/* 4. Activity Heatmap */}
      <ActivityHeatmap 
        animeList={animeList} 
        mangaList={mangaList} 
        currentType={currentType}
        theme={theme}
      />
    </div>
  );
}
