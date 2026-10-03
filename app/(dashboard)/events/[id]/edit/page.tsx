"use client";

import { useState, useEffect } from "react";
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
  bannerUrl: string | null;
}

export default function EditEventPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      
      const { data: event, error: fetchError } = await supabase
        .from("events")
        .select("*, event_registrations(count)")
        .eq("id", params.id)
        .single();

      if (fetchError || !event) {
        toast.error("Sự kiện không tồn tại");
        router.push("/events");
        return;
      }

      // Check permissions
      if (profile?.role !== "ADMIN" && event.created_by !== user.id) {
        toast.error("Bạn không có quyền chỉnh sửa sự kiện này");
        router.push("/events");
        return;
      }

      if (new Date(event.start_date) <= new Date()) {
        toast.error("Không thể sửa sự kiện đã bắt đầu hoặc trong quá khứ");
        router.push("/events");
        return;
      }

      if (event.event_registrations && event.event_registrations[0] && event.event_registrations[0].count > 0) {
        toast.error("Không thể sửa sự kiện đã có người đăng ký");
        router.push("/events");
        return;
      }

      const formatT = (ds: string) => {
        const d = new Date(ds);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
      };

      setForm({
        title: event.title,
        description: event.description || "",
        category: event.category || "",
        organizerId: event.organizer_id,
        isOnline: event.is_online,
        location: event.location || "",
        onlineUrl: event.online_url || "",
        startDate: formatT(event.start_date),
        endDate: formatT(event.end_date),
        registrationDeadline: formatT(event.registration_deadline),
        maxCapacity: event.max_capacity,
        bannerFile: null,
        bannerUrl: event.banner_url
      });
      setLoading(false);
    }
    load();
  }, [params.id]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => f ? { ...f, [key]: value } : f);
  }

  function validateStep(): string | null {
    if (!form) return null;
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
    if (!form) return;
    setSubmitting(true);
    setError(null);

    try {
      let newBannerUrl = form.bannerUrl;
      if (form.bannerFile) {
        const path = `banners/${crypto.randomUUID()}-${form.bannerFile.name}`;
        const { error: uploadError } = await supabase.storage.from("event-assets").upload(path, form.bannerFile);
        if (uploadError) throw uploadError;
        newBannerUrl = supabase.storage.from("event-assets").getPublicUrl(path).data.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("events")
        .update({
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
          banner_url: newBannerUrl,
        })
        .eq("id", params.id);

      if (updateError) throw updateError;

      toast.success("Event updated");
      router.push(`/events/${params.id}`);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong updating the event");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !form) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <h1 className="font-display text-2xl font-semibold">Chỉnh sửa sự kiện</h1>

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
            {form.bannerFile ? form.bannerFile.name : (form.bannerUrl ? "Click to upload a new banner (replaces old one)" : "Click to upload a banner image (optional)")}
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
              {submitting ? "Updating…" : "Save changes"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
