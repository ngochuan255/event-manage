"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Clock, MapPin, Plus, User, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  activitySchema,
  validateActivity,
  type ActivityDraft,
  type ValidationIssue,
} from "@/lib/validations/agenda";
import type { EventActivity, EventRow } from "@/lib/types/database.types";

const EMPTY_DRAFT: ActivityDraft = {
  title: "",
  speaker_name: "",
  room: "",
  start_time: "",
  end_time: "",
  description: "",
};

interface AgendaSchedulerProps {
  event: Pick<EventRow, "id" | "start_date" | "end_date">;
  initialActivities: EventActivity[];
  canEdit: boolean;
}

export function AgendaScheduler({ event, initialActivities, canEdit }: AgendaSchedulerProps) {
  const supabase = useMemo(() => createClient(), []);
  const [activities, setActivities] = useState<EventActivity[]>(
    [...initialActivities].sort((a, b) => a.start_time.localeCompare(b.start_time))
  );
  const [draft, setDraft] = useState<ActivityDraft>(EMPTY_DRAFT);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function updateDraft<K extends keyof ActivityDraft>(key: K, value: ActivityDraft[K]) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    setIssues(validateActivity(next, event, activities));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = activitySchema.safeParse(draft);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Please check the form fields");
      return;
    }

    const liveIssues = validateActivity(draft, event, activities);
    if (liveIssues.length > 0) {
      setIssues(liveIssues);
      return;
    }

    setSaving(true);
    // The DB trigger `enforce_activity_rules` re-checks both rules
    // server-side, so this stays correct even under concurrent edits.
    const { data, error } = await supabase
      .from("event_activities")
      .insert({
        event_id: event.id,
        title: draft.title,
        speaker_name: draft.speaker_name || null,
        room: draft.room || null,
        start_time: new Date(draft.start_time).toISOString(),
        end_time: new Date(draft.end_time).toISOString(),
        description: draft.description || null,
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setActivities((prev) => [...prev, data].sort((a, b) => a.start_time.localeCompare(b.start_time)));
    setDraft(EMPTY_DRAFT);
  }

  async function handleDelete(id: string) {
    const prev = activities;
    setActivities((a) => a.filter((x) => x.id !== id));
    const { error } = await supabase.from("event_activities").delete().eq("id", id);
    if (error) setActivities(prev);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-3">
        <h3 className="font-display text-lg font-semibold">Agenda</h3>
        {activities.length === 0 ? (
          <Card className="p-6 text-sm text-slate-400">No sessions scheduled yet.</Card>
        ) : (
          <ol className="relative space-y-3 border-l border-white/10 pl-5">
            {activities.map((a, i) => (
              <motion.li
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative"
              >
                <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-gradient" />
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(a.start_time).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}{" "}
                          –{" "}
                          {new Date(a.end_time).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        {a.room && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {a.room}
                          </span>
                        )}
                        {a.speaker_name && (
                          <span className="flex items-center gap-1">
                            <User size={12} /> {a.speaker_name}
                          </span>
                        )}
                      </div>
                      {a.description && (
                        <p className="mt-2 text-sm text-slate-400">{a.description}</p>
                      )}
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleDelete(a.id)}
                        aria-label="Remove activity"
                        className="text-slate-500 hover:text-status-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </Card>
              </motion.li>
            ))}
          </ol>
        )}
      </div>

      {canEdit && (
        <Card className="h-fit p-5">
          <h4 className="mb-4 font-display font-semibold">Add session</h4>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              placeholder="Session title"
              value={draft.title}
              onChange={(e) => updateDraft("title", e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Speaker"
                value={draft.speaker_name}
                onChange={(e) => updateDraft("speaker_name", e.target.value)}
              />
              <Input
                placeholder="Room"
                value={draft.room}
                onChange={(e) => updateDraft("room", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs text-slate-400">
                Start
                <Input
                  type="datetime-local"
                  value={draft.start_time}
                  onChange={(e) => updateDraft("start_time", e.target.value)}
                  required
                />
              </label>
              <label className="space-y-1 text-xs text-slate-400">
                End
                <Input
                  type="datetime-local"
                  value={draft.end_time}
                  onChange={(e) => updateDraft("end_time", e.target.value)}
                  required
                />
              </label>
            </div>
            <textarea
              placeholder="Description (optional)"
              value={draft.description}
              onChange={(e) => updateDraft("description", e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo"
            />

            {(issues.length > 0 || formError) && (
              <div className="flex items-start gap-2 rounded-xl border border-status-danger/30 bg-status-danger/10 p-3 text-sm text-status-danger">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <div className="space-y-1">
                  {formError && <p>{formError}</p>}
                  {issues.map((issue, i) => (
                    <p key={i}>{issue.message}</p>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" disabled={saving} className="w-full">
              <Plus size={16} /> {saving ? "Adding…" : "Add to agenda"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
