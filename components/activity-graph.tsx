'use client';

import { useMemo } from 'react';
import { format, subDays, startOfWeek, addDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ActivityLog } from '@/lib/supabase';

interface ActivityGraphProps {
  data: ActivityLog[];
}

export function ActivityGraph({ data }: ActivityGraphProps) {
  const weeks = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 89);
    const weeksArray = [];
    let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 1 });

    while (currentWeekStart <= endDate) {
      const days = [];
      for (let i = 0; i < 7; i++) {
        const day = addDays(currentWeekStart, i);
        if (day > endDate) break;
        const log = data.find((d) => isSameDay(new Date(d.date), day));
        days.push({
          date: day,
          count: log ? log.note_count + log.edit_count : 0,
        });
      }
      if (days.length > 0) {
        weeksArray.push(days);
      }
      currentWeekStart = addDays(currentWeekStart, 7);
    }
    return weeksArray;
  }, [data]);

  const maxCount = useMemo(() => {
    return Math.max(...data.map((d) => d.note_count + d.edit_count), 1);
  }, [data]);

  const getLevel = (count: number) => {
    if (count === 0) return 0;
    if (count <= maxCount * 0.25) return 1;
    if (count <= maxCount * 0.5) return 2;
    if (count <= maxCount * 0.75) return 3;
    return 4;
  };

  const levelColors = [
    'bg-[#ECECF3]',
    'bg-[#6D4AFF]/20',
    'bg-[#6D4AFF]/40',
    'bg-[#6D4AFF]/60',
    'bg-[#6D4AFF]',
  ];

  return (
    <div className="w-full">
      <div className="flex gap-[3px] overflow-x-auto pb-2 scrollbar-thin">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => {
              const level = getLevel(day.count);
              return (
                <div
                  key={di}
                  className={cn(
                    'w-[10px] h-[10px] rounded-[2px] transition-all duration-200 hover:scale-125',
                    levelColors[level]
                  )}
                  title={`${format(day.date, 'MMM dd, yyyy')}: ${day.count} activities`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-[11px] text-[#9CA3AF]">
        <span>Less</span>
        <div className="flex gap-[3px]">
          {levelColors.map((color, i) => (
            <div key={i} className={cn('w-[10px] h-[10px] rounded-[2px]', color)} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
