"use client";

import { useMemo, useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { EventCard, EventCardSkeleton } from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EventStatus, EventWithOrganizer } from "@/lib/types/database.types";

const STATUS_TABS: Array<{ label: string; value: EventStatus | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Upcoming", value: "UPCOMING" },
  { label: "Ongoing", value: "ONGOING" },
  { label: "Past", value: "PAST" },
];

interface BentoGridProps {
  events: EventWithOrganizer[];
  loading?: boolean;
  initialCategory?: string;
  currentUserId?: string | null;
  currentUserRole?: string;
}

export function BentoGrid({ events, loading, initialCategory, currentUserId, currentUserRole }: BentoGridProps) {
  const [status, setStatus] = useState<EventStatus | "ALL">("ALL");
  const [categories, setCategories] = useState<string[]>(initialCategory ? [initialCategory] : []);
  const [venues, setVenues] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (initialCategory) {
      setCategories([initialCategory]);
    } else {
      setCategories([]);
    }
  }, [initialCategory]);

  const allCategories = useMemo(
    () => Array.from(new Set(events.map((e) => e.category).filter(Boolean))) as string[],
    [events]
  );
  const allVenues = useMemo(
    () => Array.from(new Set(events.map((e) => e.location).filter(Boolean))) as string[],
    [events]
  );

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (status !== "ALL" && e.status !== status) return false;
      if (categories.length && !categories.includes(e.category ?? "")) return false;
      if (venues.length && !venues.includes(e.location ?? "")) return false;
      return true;
    });
  }, [events, status, categories, venues]);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const activeFilterCount = categories.length + venues.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-2">
          <div className="glass flex rounded-xl p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  status === tab.value ? "bg-brand-gradient text-white" : "text-slate-400 hover:text-slate-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Button variant="glass" size="icon" onClick={() => setFiltersOpen((v) => !v)} aria-label="Toggle filters">
            <SlidersHorizontal size={16} />
          </Button>
          {activeFilterCount > 0 && <Badge>{activeFilterCount}</Badge>}
        </div>
      </div>

      {filtersOpen && (
        <div className="glass grid gap-4 rounded-2xl p-4 sm:grid-cols-2">
          <FilterGroup
            label="Category"
            options={allCategories}
            selected={categories}
            onToggle={(v) => toggle(categories, setCategories, v)}
          />
          <FilterGroup
            label="Venue"
            options={allVenues}
            selected={venues}
            onToggle={(v) => toggle(venues, setVenues, v)}
          />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-slate-400">
          No events match those filters. Try clearing a filter or searching something else.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} currentUserId={currentUserId} currentUserRole={currentUserRole} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (!options.length) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={cn(
                "flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors",
                active
                  ? "border-brand-indigo/40 bg-brand-indigo/15 text-brand-indigo"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              )}
            >
              {opt}
              {active && <X size={12} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
