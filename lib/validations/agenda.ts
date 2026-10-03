import { z } from "zod";

export const activitySchema = z
  .object({
    id: z.string().optional(),
    title: z.string().min(2, "Title is too short"),
    speaker_name: z.string().optional(),
    room: z.string().optional(),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
    description: z.string().optional(),
  })
  .refine((a) => new Date(a.end_time) > new Date(a.start_time), {
    message: "End time must be after start time",
    path: ["end_time"],
  });

export type ActivityDraft = z.infer<typeof activitySchema>;

export interface ExistingActivity {
  id: string;
  room?: string | null;
  start_time: string;
  end_time: string;
}

export interface EventWindow {
  start_date: string;
  end_date: string;
}

export interface ValidationIssue {
  field: "start_time" | "end_time" | "room" | "general";
  message: string;
}

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Rule 1: activity must sit fully inside the parent event's window.
 * Rule 2: activity must not overlap another activity in the same room.
 * Returns an empty array when the draft is valid.
 */
export function validateActivity(
  draft: ActivityDraft,
  eventWindow: EventWindow,
  existingActivities: ExistingActivity[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const start = new Date(draft.start_time);
  const end = new Date(draft.end_time);
  const eventStart = new Date(eventWindow.start_date);
  const eventEnd = new Date(eventWindow.end_date);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    issues.push({ field: "general", message: "Enter valid start and end times" });
    return issues;
  }

  if (end <= start) {
    issues.push({ field: "end_time", message: "End time must be after start time" });
  }

  if (start < eventStart || end > eventEnd) {
    issues.push({
      field: "general",
      message: `Activity must fall within the event window (${eventStart.toLocaleString()} – ${eventEnd.toLocaleString()})`,
    });
  }

  if (draft.room) {
    const conflict = existingActivities.find(
      (a) =>
        a.id !== draft.id &&
        a.room === draft.room &&
        rangesOverlap(start, end, new Date(a.start_time), new Date(a.end_time))
    );
    if (conflict) {
      issues.push({
        field: "room",
        message: `Room "${draft.room}" is already booked for an overlapping time slot`,
      });
    }
  }

  return issues;
}
