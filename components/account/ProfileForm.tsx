"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Gender } from "@/lib/types/database.types";
import { DefaultAvatar } from "./AccountSidebar";

interface Props {
  userId: string;
  email: string;
  emailConfirmed: boolean;
  initial: {
    fullName: string;
    phone: string | null;
    dateOfBirth: string | null;
    gender: Gender | null;
  };
}

const GENDERS: { value: Gender; label: string }[] = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

const fieldClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#00b14f] focus:outline-none focus:ring-2 focus:ring-[#00b14f]/30 dark:border-white/10 dark:bg-white/5 dark:text-slate-100";

/** Stored as "+84xxxxxxxxx"; the form edits only the local part. */
function toLocal(phone: string | null) {
  return phone?.replace(/^\+84/, "") ?? "";
}

export function ProfileForm({ userId, email, emailConfirmed, initial }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [fullName, setFullName] = useState(initial.fullName);
  const [phone, setPhone] = useState(toLocal(initial.phone));
  const [dob, setDob] = useState(initial.dateOfBirth ?? "");
  const [gender, setGender] = useState<Gender | null>(initial.gender);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const name = fullName.trim();
    const digits = phone.replace(/\D/g, "").replace(/^0/, "");
    if (!name) return setError("Vui lòng nhập họ và tên");
    if (digits && !/^\d{9,10}$/.test(digits)) return setError("Số điện thoại không hợp lệ");
    if (dob && dob > today) return setError("Ngày sinh không được ở tương lai");

    setSaving(true);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: name,
        phone: digits ? `+84${digits}` : null,
        date_of_birth: dob || null,
        gender,
      })
      .eq("id", userId);
    setSaving(false);

    if (updateError) return setError(updateError.message);
    setPhone(digits);
    toast.success("Đã cập nhật thông tin tài khoản");
    router.refresh(); // header shows the new name
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <DefaultAvatar />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Cung cấp thông tin chính xác sẽ hỗ trợ bạn trong quá trình đăng ký sự kiện, hoặc khi cần
          xác thực vé
        </p>
      </div>

      <Field label="Họ và tên" htmlFor="profile-full-name">
        <input
          id="profile-full-name"
          className={fieldClass}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          maxLength={100}
          required
        />
      </Field>

      <Field label="Số điện thoại" htmlFor="profile-phone">
        <div className="flex gap-2">
          <span
            className={cn(fieldClass, "flex w-20 shrink-0 items-center justify-center text-slate-500")}
          >
            +84
          </span>
          <input
            id="profile-phone"
            type="tel"
            inputMode="numeric"
            className={fieldClass}
            placeholder="Nhập ở đây"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel-national"
            maxLength={11}
          />
        </div>
      </Field>

      <Field label="Email" htmlFor="profile-email">
        <div className="relative">
          <input
            id="profile-email"
            className={cn(fieldClass, "cursor-not-allowed pr-11 opacity-60")}
            value={email}
            disabled
          />
          {emailConfirmed && (
            <CheckCircle2
              size={18}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00b14f]"
              aria-label="Email đã xác thực"
            />
          )}
        </div>
      </Field>

      <Field label="Ngày tháng năm sinh" htmlFor="profile-dob">
        <input
          id="profile-dob"
          type="date"
          className={cn(fieldClass, "dark:[color-scheme:dark]")}
          value={dob}
          max={today}
          onChange={(e) => setDob(e.target.value)}
        />
      </Field>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold">Giới tính</legend>
        <div className="flex gap-8">
          {GENDERS.map((g) => (
            <label key={g.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                id={`profile-gender-${g.value.toLowerCase()}`}
                type="radio"
                name="gender"
                className="h-4 w-4 accent-[#00b14f]"
                checked={gender === g.value}
                onChange={() => setGender(g.value)}
              />
              {g.label}
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm text-status-danger">{error}</p>}

      <button
        id="profile-submit"
        type="submit"
        disabled={saving}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#00b14f] text-sm font-semibold text-white shadow-lg shadow-[#00b14f]/25 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        {saving ? "Đang lưu…" : "Hoàn thành"}
      </button>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-sm font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}
