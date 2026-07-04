import React, { useMemo, useState } from "react";
import { ActivityCalendar, ThemeInput } from "react-activity-calendar";
import { RawAnimeItem, RawMangaItem, ListType } from "../types";
import { format, parse, isValid, subYears, isAfter } from "date-fns";

interface ActivityHeatmapProps {
  animeList: RawAnimeItem[];
  mangaList: RawMangaItem[];
  currentType: ListType;
  theme: "light" | "dark";
}

export default function ActivityHeatmap({ animeList, mangaList, currentType, theme }: ActivityHeatmapProps) {
  const [metric, setMetric] = useState<"completed" | "started">("completed");
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const blockSize = windowWidth < 640 ? 8 : windowWidth < 1024 ? 11 : 13;
  const blockMargin = windowWidth < 640 ? 2 : 3;
  const fontSize = windowWidth < 640 ? 10 : 14;

  const calendarData = useMemo(() => {
    const list = currentType === "anime" ? animeList : mangaList;
    const counts: Record<string, number> = {};

    const processDateString = (dateStr: string | null | undefined) => {
      if (!dateStr || dateStr === "00-00-00" || dateStr === "0000-00-00") return null;
      
      let parsedDate = null;
      if (dateStr.includes("-") && dateStr.length === 8) {
         parsedDate = parse(dateStr, "MM-dd-yy", new Date());
      } else if (dateStr.length === 10) {
         parsedDate = parse(dateStr, "yyyy-MM-dd", new Date());
      }
      
      if (parsedDate && isValid(parsedDate)) {
         return format(parsedDate, "yyyy-MM-dd");
      }
      return null;
    };

    list.forEach((item) => {
      const dateStr = metric === "completed" ? item.finish_date_string : item.start_date_string;
      const formattedDate = processDateString(dateStr);
      
      if (formattedDate) {
        counts[formattedDate] = (counts[formattedDate] || 0) + 1;
      }
    });

    const oneYearAgo = subYears(new Date(), 1);
    const endDate = new Date();
    
    const data: Array<{ date: string; count: number; level: number }> = [];
    
    let currentDate = new Date(oneYearAgo);
    while (!isAfter(currentDate, endDate)) {
      const dStr = format(currentDate, "yyyy-MM-dd");
      const count = counts[dStr] || 0;
      let level = 0;
      
      if (count > 0 && count <= 1) level = 1;
      else if (count === 2) level = 2;
      else if (count >= 3 && count <= 4) level = 3;
      else if (count >= 5) level = 4;

      data.push({
        date: dStr,
        count,
        level,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  }, [animeList, mangaList, currentType, metric]);

  const explicitTheme: ThemeInput = {
    light: ['#e5e5e5', '#a8d1e3', '#66a2b8', '#337a96', '#005f87'],
    dark: ['#21262d', '#1d4177', '#2b65ba', '#4082e6', '#58a6ff'],
  };

  return (
    <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm mt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
        <h5 className="text-app-text font-semibold text-sm font-sans flex items-center gap-2">
          Activity Heatmap
          <span className="text-[10px] text-app-text-faint font-normal bg-app-bg px-2 py-1 rounded border border-app-border ml-2">
            Last 365 Days
          </span>
        </h5>
        
        <div className="flex bg-app-bg p-1 h-[34px] rounded-xl border border-app-border">
          <button
            onClick={() => setMetric("completed")}
            className={`px-4 h-full rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer focus:outline-none ${
              metric === "completed"
                ? "bg-app-surface text-app-heading shadow-sm"
                : "text-app-text-faint hover:text-app-text-muted"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setMetric("started")}
            className={`px-4 h-full rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer focus:outline-none ${
              metric === "started"
                ? "bg-app-surface text-app-heading shadow-sm"
                : "text-app-text-faint hover:text-app-text-muted"
            }`}
          >
            Started
          </button>
        </div>
      </div>

      <div className="flex justify-center overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-app-border scrollbar-track-transparent">
        <ActivityCalendar 
          data={calendarData} 
          theme={explicitTheme}
          colorScheme={theme}
          blockSize={blockSize}
          blockMargin={blockMargin}
          fontSize={fontSize}
          labels={{
            totalCount: `{{count}} ${currentType === "anime" ? "anime" : "manga"} ${metric} in the last year`,
          }}
          renderBlock={(block, activity) => (
             React.cloneElement(block as React.ReactElement, {
               title: `${activity.count} ${metric} on ${activity.date}`
             })
          )}
        />
      </div>
    </div>
  );
}
