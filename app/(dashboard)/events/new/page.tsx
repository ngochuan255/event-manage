"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STEPS = ["Basics", "Schedule & capacity", "Banner"] as const;

interface FormState {
  title: string;
  description: string;
  category: string;
  organizerId: string;
  isOnline: boolean;
  location: string;
  onlineUrl: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxCapacity: number;
  bannerFile: File | null;
}

const INITIAL: FormState = {
  title: "",
  description: "",
  category: "",
  organizerId: "",
  isOnline: false,
  location: "",
  onlineUrl: "",
  startDate: "",
  endDate: "",
  registrationDeadline: "",
  maxCapacity: 100,
  bannerFile: null,
};

export default function NewEventPage() {
  const supabase = createClient();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateStep(): string | null {
    if (step === 0 && !form.title.trim()) return "Give the event a title";
    if (step === 1) {
      if (!form.startDate || !form.endDate || !form.registrationDeadline)
        return "Fill in the start, end, and registration deadline";
      if (new Date(form.endDate) <= new Date(form.startDate)) return "End date must be after the start date";
      if (new Date(form.registrationDeadline) > new Date(form.endDate))
        return "Registration deadline must be on or before the end date";
    }
    return null;
  }

  function next() {
    const issue = validateStep();
    if (issue) {
      setError(issue);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in");

      // A real app resolves this from an org-picker; for a first event we
      // fall back to a personal organizer profile named after the user.
      let organizerId = form.organizerId;
      if (!organizerId) {
        const { data: org, error: orgError } = await supabase
          .from("organizers")
          .insert({ name: `${form.title} Organizer`, owner_id: user.id })
          .select("id")
          .single();
        if (orgError) throw orgError;
        organizerId = org.id;
      }

      let bannerUrl: string | null = null;
      if (form.bannerFile) {
        const path = `banners/${crypto.randomUUID()}-${form.bannerFile.name}`;
        const { error: uploadError } = await supabase.storage.from("event-assets").upload(path, form.bannerFile);
        if (uploadError) throw uploadError;
        bannerUrl = supabase.storage.from("event-assets").getPublicUrl(path).data.publicUrl;
      }

      const { data: event, error: insertError } = await supabase
        .from("events")
        .insert({
          organizer_id: organizerId,
          title: form.title,
          description: form.description || null,
          category: form.category || null,
          location: form.isOnline ? null : form.location || null,
          is_online: form.isOnline,
          online_url: form.isOnline ? form.onlineUrl : null,
          start_date: new Date(form.startDate).toISOString(),
          end_date: new Date(form.endDate).toISOString(),
          registration_deadline: new Date(form.registrationDeadline).toISOString(),
          max_capacity: form.maxCapacity,
          banner_url: bannerUrl,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      toast.success("Event created");
      router.push(`/events/${event.id}`);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong creating the event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <h1 className="font-display text-2xl font-semibold">Create an event</h1>

      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                i <= step ? "bg-brand-gradient text-white" : "glass text-slate-400"
              )}
            >
              {i + 1}
            </div>
            <span className={cn("text-sm", i === step ? "text-slate-100" : "text-slate-500")}>{label}</span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-white/10" />}
          </div>
        ))}
      </div>

      <Card className="p-6">
        {step === 0 && (
          <div className="space-y-3">
            <Input placeholder="Event title" value={form.title} onChange={(e) => update("title", e.target.value)} />
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="flex h-10 w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-950"
            >
              <option value="" disabled>Chọn danh mục sự kiện</option>
              <option value="Nhạc sống">Nhạc sống</option>
              <option value="Sân khấu & Nghệ thuật">Sân khấu & Nghệ thuật</option>
              <option value="Thể Thao">Thể Thao</option>
              <option value="Hội thảo & Workshop">Hội thảo & Workshop</option>
              <option value="Tham quan & Trải nghiệm">Tham quan & Trải nghiệm</option>
              <option value="Khác">Khác</option>
            </select>
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo"
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!form.isOnline ? "primary" : "outline"}
                size="sm"
                onClick={() => update("isOnline", false)}
              >
                In person
              </Button>
              <Button
                type="button"
                variant={form.isOnline ? "primary" : "outline"}
                size="sm"
                onClick={() => update("isOnline", true)}
              >
                Online
              </Button>
            </div>
            {form.isOnline ? (
              <Input
                placeholder="Meeting URL"
                value={form.onlineUrl}
                onChange={(e) => update("onlineUrl", e.target.value)}
              />
            ) : (
              <Input placeholder="Venue address" value={form.location} onChange={(e) => update("location", e.target.value)} />
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs text-slate-400">
                Start
                <Input type="datetime-local" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
              </label>
              <label className="space-y-1 text-xs text-slate-400">
                End
                <Input type="datetime-local" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
              </label>
            </div>
            <label className="block space-y-1 text-xs text-slate-400">
              Registration deadline
              <Input
                type="datetime-local"
                value={form.registrationDeadline}
                onChange={(e) => update("registrationDeadline", e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-xs text-slate-400">
              Max capacity
              <Input
                type="number"
                min={1}
                value={form.maxCapacity}
                onChange={(e) => update("maxCapacity", Number(e.target.value))}
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 p-10 text-center text-sm text-slate-400 hover:border-brand-indigo/40">
            <ImagePlus size={28} />
            {form.bannerFile ? form.bannerFile.name : "Click to upload a banner image (optional)"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => update("bannerFile", e.target.files?.[0] ?? null)}
            />
          </label>
        )}

        {error && <p className="mt-3 text-sm text-status-danger">{error}</p>}

        <div className="mt-6 flex justify-between">
          <Button variant="glass" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft size={16} /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>
              Next <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {submitting ? "Creating…" : "Create event"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
