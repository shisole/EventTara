export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          full_name: string;
          username: string | null;
          avatar_url: string | null;
          role: "organizer" | "participant" | "guest";
          is_guest: boolean;
          active_border_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name: string;
          username?: string | null;
          avatar_url?: string | null;
          role?: "organizer" | "participant" | "guest";
          is_guest?: boolean;
          active_border_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string;
          username?: string | null;
          avatar_url?: string | null;
          role?: "organizer" | "participant" | "guest";
          is_guest?: boolean;
          active_border_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      organizer_profiles: {
        Row: {
          id: string;
          user_id: string;
          org_name: string;
          description: string | null;
          logo_url: string | null;
          payment_info: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          org_name: string;
          description?: string | null;
          logo_url?: string | null;
          payment_info?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          org_name?: string;
          description?: string | null;
          logo_url?: string | null;
          payment_info?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          organizer_id: string;
          title: string;
          description: string | null;
          type: "hiking" | "mtb" | "road_bike" | "running" | "trail_run";
          date: string;
          end_date: string | null;
          location: string;
          coordinates: { lat: number; lng: number } | null;
          max_participants: number;
          price: number;
          status: "draft" | "published" | "completed" | "cancelled";
          cover_image_url: string | null;
          difficulty_level: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organizer_id: string;
          title: string;
          description?: string | null;
          type: "hiking" | "mtb" | "road_bike" | "running" | "trail_run";
          date: string;
          end_date?: string | null;
          location: string;
          coordinates?: { lat: number; lng: number } | null;
          max_participants?: number;
          price?: number;
          status?: "draft" | "published" | "completed" | "cancelled";
          cover_image_url?: string | null;
          difficulty_level?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organizer_id?: string;
          title?: string;
          description?: string | null;
          type?: "hiking" | "mtb" | "road_bike" | "running" | "trail_run";
          date?: string;
          end_date?: string | null;
          location?: string;
          coordinates?: { lat: number; lng: number } | null;
          max_participants?: number;
          price?: number;
          status?: "draft" | "published" | "completed" | "cancelled";
          cover_image_url?: string | null;
          difficulty_level?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      mountains: {
        Row: {
          id: string;
          name: string;
          province: string;
          difficulty_level: number;
          elevation_masl: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          province: string;
          difficulty_level: number;
          elevation_masl?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          province?: string;
          difficulty_level?: number;
          elevation_masl?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      event_mountains: {
        Row: {
          id: string;
          event_id: string;
          mountain_id: string;
          route_name: string | null;
          difficulty_override: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          mountain_id: string;
          route_name?: string | null;
          difficulty_override?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          mountain_id?: string;
          route_name?: string | null;
          difficulty_override?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      event_distances: {
        Row: {
          id: string;
          event_id: string;
          distance_km: number;
          label: string | null;
          price: number;
          max_participants: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          distance_km: number;
          label?: string | null;
          price: number;
          max_participants: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          distance_km?: number;
          label?: string | null;
          price?: number;
          max_participants?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      guides: {
        Row: {
          id: string;
          full_name: string;
          bio: string | null;
          avatar_url: string | null;
          contact_number: string | null;
          user_id: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          contact_number?: string | null;
          user_id?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          contact_number?: string | null;
          user_id?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      event_guides: {
        Row: {
          id: string;
          event_id: string;
          guide_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          guide_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          guide_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      guide_reviews: {
        Row: {
          id: string;
          guide_id: string;
          user_id: string;
          event_id: string;
          rating: number;
          text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          guide_id: string;
          user_id: string;
          event_id: string;
          rating: number;
          text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          guide_id?: string;
          user_id?: string;
          event_id?: string;
          rating?: number;
          text?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      event_photos: {
        Row: {
          id: string;
          event_id: string;
          image_url: string;
          caption: string | null;
          sort_order: number;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          image_url: string;
          caption?: string | null;
          sort_order?: number;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          image_url?: string;
          caption?: string | null;
          sort_order?: number;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: "pending" | "confirmed" | "cancelled";
          payment_status: "pending" | "paid" | "rejected" | "refunded";
          payment_method: "gcash" | "maya" | "cash" | null;
          payment_proof_url: string | null;
          payment_verified_at: string | null;
          payment_verified_by: string | null;
          participant_cancelled: boolean;
          qr_code: string | null;
          event_distance_id: string | null;
          booked_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status?: "pending" | "confirmed" | "cancelled";
          payment_status?: "pending" | "paid" | "rejected" | "refunded";
          payment_method?: "gcash" | "maya" | "cash" | null;
          payment_proof_url?: string | null;
          payment_verified_at?: string | null;
          payment_verified_by?: string | null;
          participant_cancelled?: boolean;
          qr_code?: string | null;
          event_distance_id?: string | null;
          booked_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          status?: "pending" | "confirmed" | "cancelled";
          payment_status?: "pending" | "paid" | "rejected" | "refunded";
          payment_method?: "gcash" | "maya" | "cash" | null;
          payment_proof_url?: string | null;
          payment_verified_at?: string | null;
          payment_verified_by?: string | null;
          participant_cancelled?: boolean;
          qr_code?: string | null;
          event_distance_id?: string | null;
          booked_at?: string;
        };
        Relationships: [];
      };
      booking_companions: {
        Row: {
          id: string;
          booking_id: string;
          full_name: string;
          phone: string | null;
          qr_code: string | null;
          checked_in: boolean;
          checked_in_at: string | null;
          status: "pending" | "confirmed" | "cancelled";
          event_distance_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          full_name: string;
          phone?: string | null;
          qr_code?: string | null;
          checked_in?: boolean;
          checked_in_at?: string | null;
          status?: "pending" | "confirmed" | "cancelled";
          event_distance_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          full_name?: string;
          phone?: string | null;
          qr_code?: string | null;
          checked_in?: boolean;
          checked_in_at?: string | null;
          status?: "pending" | "confirmed" | "cancelled";
          event_distance_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      badges: {
        Row: {
          id: string;
          event_id: string;
          title: string;
          description: string | null;
          image_url: string | null;
          category: "distance" | "adventure" | "location" | "special";
          rarity: "common" | "rare" | "epic" | "legendary";
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          title: string;
          description?: string | null;
          image_url?: string | null;
          category?: "distance" | "adventure" | "location" | "special";
          rarity?: "common" | "rare" | "epic" | "legendary";
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          title?: string;
          description?: string | null;
          image_url?: string | null;
          category?: "distance" | "adventure" | "location" | "special";
          rarity?: "common" | "rare" | "epic" | "legendary";
          created_at?: string;
        };
        Relationships: [];
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          awarded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          awarded_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_id?: string;
          awarded_at?: string;
        };
        Relationships: [];
      };
      event_checkins: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          checked_in_at: string;
          method: "qr" | "manual";
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          checked_in_at?: string;
          method?: "qr" | "manual";
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          checked_in_at?: string;
          method?: "qr" | "manual";
        };
        Relationships: [];
      };
      app_testimonials: {
        Row: {
          id: string;
          name: string;
          role: string;
          text: string;
          avatar_url: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          role: string;
          text: string;
          avatar_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string;
          text?: string;
          avatar_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      event_reviews: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          rating: number;
          text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          rating: number;
          text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          rating?: number;
          text?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chat_queries: {
        Row: {
          id: string;
          user_id: string | null;
          ip_address: string | null;
          query: string;
          parsed_params: Json;
          result_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          ip_address?: string | null;
          query: string;
          parsed_params?: Json;
          result_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          ip_address?: string | null;
          query?: string;
          parsed_params?: Json;
          result_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      avatar_borders: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          tier: "common" | "rare" | "epic" | "legendary";
          criteria_type:
            | "signup_date"
            | "event_count"
            | "event_type_count"
            | "all_activities"
            | "mountain_region"
            | "organizer_event_count";
          criteria_value: Json;
          border_color: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          tier: "common" | "rare" | "epic" | "legendary";
          criteria_type:
            | "signup_date"
            | "event_count"
            | "event_type_count"
            | "all_activities"
            | "mountain_region"
            | "organizer_event_count";
          criteria_value?: Json;
          border_color?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          tier?: "common" | "rare" | "epic" | "legendary";
          criteria_type?:
            | "signup_date"
            | "event_count"
            | "event_type_count"
            | "all_activities"
            | "mountain_region"
            | "organizer_event_count";
          criteria_value?: Json;
          border_color?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      user_avatar_borders: {
        Row: {
          id: string;
          user_id: string;
          border_id: string;
          awarded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          border_id: string;
          awarded_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          border_id?: string;
          awarded_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      get_total_participants: {
        Args: { p_event_id: string };
        Returns: number;
      };
    };
    Enums: Record<never, never>;
  };
}
