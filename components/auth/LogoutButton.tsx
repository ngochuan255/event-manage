"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  variant?: "primary" | "glass" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export function LogoutButton({ variant = "ghost", size = "sm", className, showText = true }: LogoutButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh(); // Ensure the server components re-render with unauthenticated state
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
    >
      <LogOut size={16} />
      {showText && <span>Logout</span>}
    </Button>
  );
}
