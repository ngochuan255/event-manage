import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account/ProfileForm";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Thông tin tài khoản | Pulse",
  description: "Cập nhật họ tên, số điện thoại, ngày sinh và giới tính cho tài khoản của bạn.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/profile");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, date_of_birth, gender")
    .eq("id", user.id)
    .single();

  return (
    <section className="space-y-8">
      <h1 className="border-b border-slate-200 pb-4 font-display text-2xl font-bold dark:border-white/10">
        Thông tin tài khoản
      </h1>
      <ProfileForm
        userId={user.id}
        email={user.email ?? ""}
        emailConfirmed={Boolean(user.email_confirmed_at)}
        initial={{
          fullName: profile?.full_name ?? "",
          phone: profile?.phone ?? null,
          dateOfBirth: profile?.date_of_birth ?? null,
          gender: profile?.gender ?? null,
        }}
      />
    </section>
  );
}
