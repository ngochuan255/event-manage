// Mirrors supabase/migrations/0001_init.sql.
// Regenerate for real via: supabase gen types typescript --linked > lib/types/database.types.ts

export type UserRole = "ADMIN" | "ORGANIZER" | "ATTENDEE";
export type RegistrationStatus = "REGISTERED" | "CHECKED_IN" | "NO_SHOW" | "CANCELLED";
export type EventStatus = "UPCOMING" | "ONGOING" | "PAST";
export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          phone: string | null;
          date_of_birth: string | null;
          gender: Gender | null;
          role: UserRole;
          is_locked: boolean;
          no_show_count: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      organizers: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          description: string | null;
          logo_url: string | null;
          website: string | null;
          social_links: Record<string, string>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["organizers"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["organizers"]["Row"]>;
      };
      events: {
        Row: {
          id: string;
          organizer_id: string;
          title: string;
          description: string | null;
          banner_url: string | null;
          category: string | null;
          location: string | null;
          is_online: boolean;
          online_url: string | null;
          start_date: string;
          end_date: string;
          registration_deadline: string;
          max_capacity: number;
          status: EventStatus;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["events"]["Row"]> & {
          organizer_id: string;
          title: string;
          start_date: string;
          end_date: string;
          registration_deadline: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Row"]>;
      };
      event_activities: {
        Row: {
          id: string;
          event_id: string;
          title: string;
          speaker_name: string | null;
          speaker_avatar: string | null;
          room: string | null;
          start_time: string;
          end_time: string;
          description: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["event_activities"]["Row"]> & {
          event_id: string;
          title: string;
          start_time: string;
          end_time: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_activities"]["Row"]>;
      };
      event_registrations: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          ticket_code: string;
          status: RegistrationStatus;
          checked_in_at: string | null;
          checked_in_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["event_registrations"]["Row"]> & {
          event_id: string;
          user_id: string;
          ticket_code: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_registrations"]["Row"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target_entity: string | null;
          target_id: string | null;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]> & { action: string };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Organizer = Database["public"]["Tables"]["organizers"]["Row"];
export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type EventActivity = Database["public"]["Tables"]["event_activities"]["Row"];
export type EventRegistration = Database["public"]["Tables"]["event_registrations"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

export type EventWithOrganizer = EventRow & {
  organizers: Pick<Organizer, "id" | "name" | "logo_url"> | null;
  registration_count?: number;
};
