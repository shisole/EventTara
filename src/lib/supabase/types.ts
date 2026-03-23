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
          role: "user" | "guest";
          is_guest: boolean;
          active_border_id: string | null;
          has_picked_avatar: boolean;
          last_daily_login: string | null;
          login_streak: number;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name: string;
          username?: string | null;
          avatar_url?: string | null;
          role?: "user" | "guest";
          is_guest?: boolean;
          active_border_id?: string | null;
          has_picked_avatar?: boolean;
          last_daily_login?: string | null;
          login_streak?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string;
          username?: string | null;
          avatar_url?: string | null;
          role?: "user" | "guest";
          is_guest?: boolean;
          active_border_id?: string | null;
          has_picked_avatar?: boolean;
          last_daily_login?: string | null;
          login_streak?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          club_id: string;
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
          is_featured: boolean;
          is_demo: boolean;
          members_only: boolean;
          payment_paused: boolean;
          contact_url: string | null;
          drive_folder_url: string | null;
          waiver_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
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
          is_featured?: boolean;
          is_demo?: boolean;
          members_only?: boolean;
          payment_paused?: boolean;
          contact_url?: string | null;
          drive_folder_url?: string | null;
          waiver_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
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
          is_featured?: boolean;
          is_demo?: boolean;
          members_only?: boolean;
          payment_paused?: boolean;
          contact_url?: string | null;
          drive_folder_url?: string | null;
          waiver_text?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
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
          user_id: string | null;
          image_url: string;
          caption: string | null;
          sort_order: number;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id?: string | null;
          image_url: string;
          caption?: string | null;
          sort_order?: number;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string | null;
          image_url?: string;
          caption?: string | null;
          sort_order?: number;
          uploaded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_photos_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_photos_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          event_id: string;
          user_id: string | null;
          status: "pending" | "confirmed" | "cancelled" | "reserved";
          payment_status: "pending" | "paid" | "rejected" | "refunded";
          payment_method: "gcash" | "maya" | "cash" | null;
          payment_proof_url: string | null;
          payment_verified_at: string | null;
          payment_verified_by: string | null;
          participant_cancelled: boolean;
          qr_code: string | null;
          event_distance_id: string | null;
          booked_at: string;
          added_by: string | null;
          manual_status: "paid" | "reserved" | "pending" | null;
          manual_name: string | null;
          manual_contact: string | null;
          participant_notes: string | null;
          organizer_notes: string | null;
          waiver_accepted_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id?: string | null;
          status?: "pending" | "confirmed" | "cancelled" | "reserved";
          payment_status?: "pending" | "paid" | "rejected" | "refunded";
          payment_method?: "gcash" | "maya" | "cash" | null;
          payment_proof_url?: string | null;
          payment_verified_at?: string | null;
          payment_verified_by?: string | null;
          participant_cancelled?: boolean;
          qr_code?: string | null;
          event_distance_id?: string | null;
          booked_at?: string;
          added_by?: string | null;
          manual_status?: "paid" | "reserved" | "pending" | null;
          manual_name?: string | null;
          manual_contact?: string | null;
          participant_notes?: string | null;
          organizer_notes?: string | null;
          waiver_accepted_at?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string | null;
          status?: "pending" | "confirmed" | "cancelled" | "reserved";
          payment_status?: "pending" | "paid" | "rejected" | "refunded";
          payment_method?: "gcash" | "maya" | "cash" | null;
          payment_proof_url?: string | null;
          payment_verified_at?: string | null;
          payment_verified_by?: string | null;
          participant_cancelled?: boolean;
          qr_code?: string | null;
          event_distance_id?: string | null;
          booked_at?: string;
          added_by?: string | null;
          manual_status?: "paid" | "reserved" | "pending" | null;
          manual_name?: string | null;
          manual_contact?: string | null;
          participant_notes?: string | null;
          organizer_notes?: string | null;
          waiver_accepted_at?: string | null;
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
          event_id: string | null;
          title: string;
          description: string | null;
          image_url: string | null;
          category: "distance" | "adventure" | "location" | "special";
          rarity: "common" | "rare" | "epic" | "legendary";
          type: "event" | "system";
          criteria_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          title: string;
          description?: string | null;
          image_url?: string | null;
          category?: "distance" | "adventure" | "location" | "special";
          rarity?: "common" | "rare" | "epic" | "legendary";
          type?: "event" | "system";
          criteria_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string | null;
          title?: string;
          description?: string | null;
          image_url?: string | null;
          category?: "distance" | "adventure" | "location" | "special";
          rarity?: "common" | "rare" | "epic" | "legendary";
          type?: "event" | "system";
          criteria_key?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "badges_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
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
          method: "qr" | "manual" | "online";
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          checked_in_at?: string;
          method?: "qr" | "manual" | "online";
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          checked_in_at?: string;
          method?: "qr" | "manual" | "online";
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
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          rating: number;
          text?: string | null;
          tags?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          rating?: number;
          text?: string | null;
          tags?: string[];
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
            | "club_event_count";
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
            | "club_event_count";
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
            | "club_event_count";
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
      user_badge_showcase: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          sort_order: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_id?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      badge_shares: {
        Row: {
          id: string;
          badge_id: string;
          user_id: string;
          platform: "twitter" | "facebook" | "link_copy";
          created_at: string;
        };
        Insert: {
          id?: string;
          badge_id: string;
          user_id: string;
          platform: "twitter" | "facebook" | "link_copy";
          created_at?: string;
        };
        Update: {
          id?: string;
          badge_id?: string;
          user_id?: string;
          platform?: "twitter" | "facebook" | "link_copy";
          created_at?: string;
        };
        Relationships: [];
      };
      user_follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      feed_comments: {
        Row: {
          id: string;
          user_id: string;
          activity_type: "booking" | "checkin" | "badge" | "border" | "review" | "photo";
          activity_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: "booking" | "checkin" | "badge" | "border" | "review" | "photo";
          activity_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: "booking" | "checkin" | "badge" | "border" | "review" | "photo";
          activity_id?: string;
          text?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      feed_comment_likes: {
        Row: {
          id: string;
          user_id: string;
          comment_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          comment_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          comment_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      feed_reactions: {
        Row: {
          id: string;
          user_id: string;
          activity_type: "booking" | "checkin" | "badge" | "border" | "review" | "photo";
          activity_id: string;
          emoji: "heart";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: "booking" | "checkin" | "badge" | "border" | "review" | "photo";
          activity_id: string;
          emoji: "heart";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: "booking" | "checkin" | "badge" | "border" | "review" | "photo";
          activity_id?: string;
          emoji?: "heart";
          created_at?: string;
        };
        Relationships: [];
      };
      feed_reposts: {
        Row: {
          id: string;
          user_id: string;
          activity_type: "booking" | "checkin" | "badge" | "border" | "review" | "photo";
          activity_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: "booking" | "checkin" | "badge" | "border" | "review" | "photo";
          activity_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: "booking" | "checkin" | "badge" | "border" | "review" | "photo";
          activity_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          keys_p256dh: string;
          keys_auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          keys_p256dh: string;
          keys_auth: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          keys_p256dh?: string;
          keys_auth?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type:
            | "booking_confirmed"
            | "event_reminder"
            | "badge_earned"
            | "border_earned"
            | "feed_like"
            | "feed_repost"
            | "feed_comment_like"
            | "feed_mention"
            | "review_request"
            | "event_published"
            | "forum_reply"
            | "forum_mention";
          title: string;
          body: string;
          href: string | null;
          actor_id: string | null;
          metadata: Record<string, unknown>;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type:
            | "booking_confirmed"
            | "event_reminder"
            | "badge_earned"
            | "border_earned"
            | "feed_like"
            | "feed_repost"
            | "feed_comment_like"
            | "feed_mention"
            | "review_request"
            | "event_published"
            | "forum_reply"
            | "forum_mention";
          title: string;
          body: string;
          href?: string | null;
          actor_id?: string | null;
          metadata?: Record<string, unknown>;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?:
            | "booking_confirmed"
            | "event_reminder"
            | "badge_earned"
            | "border_earned"
            | "feed_like"
            | "feed_repost"
            | "feed_comment_like"
            | "feed_mention"
            | "review_request"
            | "event_published"
            | "forum_reply"
            | "forum_mention";
          title?: string;
          body?: string;
          href?: string | null;
          actor_id?: string | null;
          metadata?: Record<string, unknown>;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      cms_site_settings: {
        Row: {
          id: number;
          site_name: string;
          tagline: string;
          site_description: string;
          site_url: string | null;
          contact_email: string | null;
          copyright_text: string | null;
          nav_layout: "strip" | "grid" | "list";
          parallax_image_url: string | null;
          seo_title_template: string | null;
          seo_keywords: string | null;
          seo_og_locale: string | null;
        };
        Insert: {
          id?: number;
          site_name: string;
          tagline: string;
          site_description: string;
          site_url?: string | null;
          contact_email?: string | null;
          copyright_text?: string | null;
          nav_layout?: "strip" | "grid" | "list";
          parallax_image_url?: string | null;
          seo_title_template?: string | null;
          seo_keywords?: string | null;
          seo_og_locale?: string | null;
        };
        Update: {
          id?: number;
          site_name?: string;
          tagline?: string;
          site_description?: string;
          site_url?: string | null;
          contact_email?: string | null;
          copyright_text?: string | null;
          nav_layout?: "strip" | "grid" | "list";
          parallax_image_url?: string | null;
          seo_title_template?: string | null;
          seo_keywords?: string | null;
          seo_og_locale?: string | null;
        };
        Relationships: [];
      };
      cms_navigation: {
        Row: {
          id: number;
          header_links: Json;
          footer_tagline: string | null;
          footer_sections: Json;
          footer_legal_links: Json;
        };
        Insert: {
          id?: number;
          header_links?: Json;
          footer_tagline?: string | null;
          footer_sections?: Json;
          footer_legal_links?: Json;
        };
        Update: {
          id?: number;
          header_links?: Json;
          footer_tagline?: string | null;
          footer_sections?: Json;
          footer_legal_links?: Json;
        };
        Relationships: [];
      };
      cms_hero_carousel: {
        Row: {
          id: number;
          slides: Json;
        };
        Insert: {
          id?: number;
          slides?: Json;
        };
        Update: {
          id?: number;
          slides?: Json;
        };
        Relationships: [];
      };
      cms_feature_flags: {
        Row: {
          id: number;
          activity_feed: boolean;
          strava_showcase_features: boolean;
          strava_showcase_stats: boolean;
          strava_showcase_route_map: boolean;
          club_reviews: boolean;
          events_two_col_mobile: boolean;
          coming_soon_strava: boolean;
          coming_soon_gamification: boolean;
          coming_soon_bento: boolean;
          ewallet_payments: boolean;
          oauth_google: boolean;
          oauth_strava: boolean;
          oauth_facebook: boolean;
          onboarding_quiz: boolean;
          duck_race: boolean;
          avatar_shop_enabled: boolean;
          new_landing_page: boolean;
          payment_pause: boolean;
        };
        Insert: {
          id?: number;
          activity_feed?: boolean;
          strava_showcase_features?: boolean;
          strava_showcase_stats?: boolean;
          strava_showcase_route_map?: boolean;
          club_reviews?: boolean;
          events_two_col_mobile?: boolean;
          coming_soon_strava?: boolean;
          coming_soon_gamification?: boolean;
          coming_soon_bento?: boolean;
          ewallet_payments?: boolean;
          oauth_google?: boolean;
          oauth_strava?: boolean;
          oauth_facebook?: boolean;
          onboarding_quiz?: boolean;
          duck_race?: boolean;
          avatar_shop_enabled?: boolean;
          new_landing_page?: boolean;
          payment_pause?: boolean;
        };
        Update: {
          id?: number;
          activity_feed?: boolean;
          strava_showcase_features?: boolean;
          strava_showcase_stats?: boolean;
          strava_showcase_route_map?: boolean;
          club_reviews?: boolean;
          events_two_col_mobile?: boolean;
          coming_soon_strava?: boolean;
          coming_soon_gamification?: boolean;
          coming_soon_bento?: boolean;
          ewallet_payments?: boolean;
          oauth_google?: boolean;
          oauth_strava?: boolean;
          oauth_facebook?: boolean;
          onboarding_quiz?: boolean;
          duck_race?: boolean;
          avatar_shop_enabled?: boolean;
          new_landing_page?: boolean;
          payment_pause?: boolean;
        };
        Relationships: [];
      };
      cms_pages: {
        Row: {
          id: number;
          title: string;
          slug: string;
          description: string | null;
          content_html: string | null;
          status: "draft" | "published";
          last_updated_label: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          slug: string;
          description?: string | null;
          content_html?: string | null;
          status?: "draft" | "published";
          last_updated_label?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          slug?: string;
          description?: string | null;
          content_html?: string | null;
          status?: "draft" | "published";
          last_updated_label?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      strava_connections: {
        Row: {
          id: string;
          user_id: string;
          strava_athlete_id: number;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          scope: string | null;
          athlete_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          strava_athlete_id: number;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          scope?: string | null;
          athlete_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          strava_athlete_id?: number;
          access_token?: string;
          refresh_token?: string;
          expires_at?: string;
          scope?: string | null;
          athlete_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      strava_activities: {
        Row: {
          id: string;
          user_id: string;
          strava_activity_id: number;
          booking_id: string | null;
          name: string;
          type: string;
          distance: number;
          moving_time: number;
          elapsed_time: number;
          total_elevation_gain: number;
          start_date: string;
          summary_polyline: string | null;
          matched_automatically: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          strava_activity_id: number;
          booking_id?: string | null;
          name: string;
          type: string;
          distance: number;
          moving_time: number;
          elapsed_time: number;
          total_elevation_gain: number;
          start_date: string;
          summary_polyline?: string | null;
          matched_automatically?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          strava_activity_id?: number;
          booking_id?: string | null;
          name?: string;
          type?: string;
          distance?: number;
          moving_time?: number;
          elapsed_time?: number;
          total_elevation_gain?: number;
          start_date?: string;
          summary_polyline?: string | null;
          matched_automatically?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "strava_activities_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      event_routes: {
        Row: {
          id: string;
          event_id: string;
          strava_route_id: string | null;
          gpx_url: string | null;
          source: "strava" | "gpx";
          name: string;
          distance: number | null;
          elevation_gain: number | null;
          summary_polyline: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          strava_route_id?: string | null;
          gpx_url?: string | null;
          source: "strava" | "gpx";
          name: string;
          distance?: number | null;
          elevation_gain?: number | null;
          summary_polyline?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          strava_route_id?: string | null;
          gpx_url?: string | null;
          source?: "strava" | "gpx";
          name?: string;
          distance?: number | null;
          elevation_gain?: number | null;
          summary_polyline?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_routes_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: true;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      strava_webhook_subscriptions: {
        Row: {
          id: string;
          subscription_id: number;
          verify_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: number;
          verify_token: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: number;
          verify_token?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      cms_homepage_sections: {
        Row: {
          id: number;
          sections: Json;
        };
        Insert: {
          id?: number;
          sections?: Json;
        };
        Update: {
          id?: number;
          sections?: Json;
        };
        Relationships: [];
      };
      organizer_waitlist: {
        Row: {
          id: string;
          email: string;
          org_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          org_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          org_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      clubs: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          cover_url: string | null;
          activity_types: string[];
          visibility: "public" | "private";
          payment_info: Json | null;
          location: string | null;
          is_demo: boolean;
          claim_token: string | null;
          claim_expires_at: string | null;
          is_claimed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          activity_types?: string[];
          visibility?: "public" | "private";
          payment_info?: Json | null;
          location?: string | null;
          is_demo?: boolean;
          claim_token?: string | null;
          claim_expires_at?: string | null;
          is_claimed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          activity_types?: string[];
          visibility?: "public" | "private";
          payment_info?: Json | null;
          location?: string | null;
          is_demo?: boolean;
          claim_token?: string | null;
          claim_expires_at?: string | null;
          is_claimed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      club_members: {
        Row: {
          id: string;
          club_id: string;
          user_id: string;
          role: "owner" | "admin" | "moderator" | "member";
          joined_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          user_id: string;
          role?: "owner" | "admin" | "moderator" | "member";
          joined_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "moderator" | "member";
          joined_at?: string;
        };
        Relationships: [];
      };
      club_invites: {
        Row: {
          id: string;
          club_id: string;
          invited_by: string;
          invite_code: string;
          max_uses: number | null;
          uses: number;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          invited_by: string;
          invite_code: string;
          max_uses?: number | null;
          uses?: number;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          invited_by?: string;
          invite_code?: string;
          max_uses?: number | null;
          uses?: number;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      club_reviews: {
        Row: {
          id: string;
          club_id: string;
          user_id: string;
          rating: number;
          text: string | null;
          is_anonymous: boolean;
          guest_name: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          user_id: string;
          rating: number;
          text?: string | null;
          is_anonymous?: boolean;
          guest_name?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          user_id?: string;
          rating?: number;
          text?: string | null;
          is_anonymous?: boolean;
          guest_name?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      club_review_photos: {
        Row: {
          id: string;
          review_id: string;
          image_url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          image_url: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          image_url?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      event_review_photos: {
        Row: {
          id: string;
          review_id: string;
          image_url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          image_url: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          image_url?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      quiz_responses: {
        Row: {
          id: string;
          user_id: string | null;
          anonymous_id: string;
          activities: string[];
          experience_level: "beginner" | "intermediate" | "advanced" | null;
          first_name: string | null;
          age_range: "18-24" | "25-34" | "35-44" | "45-54" | "55+" | null;
          location: string | null;
          discovery_source: "social_media" | "friend" | "google" | "poster" | "other" | null;
          completed_at: string | null;
          skipped_at_step: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          anonymous_id: string;
          activities?: string[];
          experience_level?: "beginner" | "intermediate" | "advanced" | null;
          first_name?: string | null;
          age_range?: "18-24" | "25-34" | "35-44" | "45-54" | "55+" | null;
          location?: string | null;
          discovery_source?: "social_media" | "friend" | "google" | "poster" | "other" | null;
          completed_at?: string | null;
          skipped_at_step?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          anonymous_id?: string;
          activities?: string[];
          experience_level?: "beginner" | "intermediate" | "advanced" | null;
          first_name?: string | null;
          age_range?: "18-24" | "25-34" | "35-44" | "45-54" | "55+" | null;
          location?: string | null;
          discovery_source?: "social_media" | "friend" | "google" | "poster" | "other" | null;
          completed_at?: string | null;
          skipped_at_step?: number | null;
        };
        Relationships: [];
      };
      club_forum_categories: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          slug: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          name: string;
          slug: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      club_forum_threads: {
        Row: {
          id: string;
          club_id: string;
          category_id: string | null;
          user_id: string;
          title: string;
          body: string;
          type: "discussion" | "announcement" | "poll";
          poll_options: string[] | null;
          is_pinned: boolean;
          is_locked: boolean;
          reply_count: number;
          last_activity_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          category_id?: string | null;
          user_id: string;
          title: string;
          body: string;
          type?: "discussion" | "announcement" | "poll";
          poll_options?: string[] | null;
          is_pinned?: boolean;
          is_locked?: boolean;
          reply_count?: number;
          last_activity_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          category_id?: string | null;
          user_id?: string;
          title?: string;
          body?: string;
          type?: "discussion" | "announcement" | "poll";
          poll_options?: string[] | null;
          is_pinned?: boolean;
          is_locked?: boolean;
          reply_count?: number;
          last_activity_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      club_forum_replies: {
        Row: {
          id: string;
          thread_id: string;
          user_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          user_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          user_id?: string;
          text?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      club_forum_poll_votes: {
        Row: {
          id: string;
          thread_id: string;
          user_id: string;
          option_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          user_id: string;
          option_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          user_id?: string;
          option_index?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      club_races: {
        Row: {
          id: string;
          club_id: string;
          title: string;
          num_winners: number;
          duration_seconds: number;
          event_id: string | null;
          badge_id: string | null;
          status: "pending" | "completed";
          winner_ids: string[];
          participant_ids: string[];
          created_by: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          club_id: string;
          title?: string;
          num_winners?: number;
          duration_seconds?: number;
          event_id?: string | null;
          badge_id?: string | null;
          status?: "pending" | "completed";
          winner_ids?: string[];
          participant_ids?: string[];
          created_by?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          club_id?: string;
          title?: string;
          num_winners?: number;
          duration_seconds?: number;
          event_id?: string | null;
          badge_id?: string | null;
          status?: "pending" | "completed";
          winner_ids?: string[];
          participant_ids?: string[];
          created_by?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "club_races_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_races_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_races_badge_id_fkey";
            columns: ["badge_id"];
            isOneToOne: false;
            referencedRelation: "badges";
            referencedColumns: ["id"];
          },
        ];
      };
      welcome_pages: {
        Row: {
          id: string;
          code: string;
          title: string;
          subtitle: string | null;
          description: string | null;
          badge_id: string | null;
          club_id: string | null;
          event_id: string | null;
          redirect_url: string;
          hero_image_url: string | null;
          max_claims: number | null;
          expires_at: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          title: string;
          subtitle?: string | null;
          description?: string | null;
          badge_id?: string | null;
          club_id?: string | null;
          event_id?: string | null;
          redirect_url?: string;
          hero_image_url?: string | null;
          max_claims?: number | null;
          expires_at?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          title?: string;
          subtitle?: string | null;
          description?: string | null;
          badge_id?: string | null;
          club_id?: string | null;
          event_id?: string | null;
          redirect_url?: string;
          hero_image_url?: string | null;
          max_claims?: number | null;
          expires_at?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "welcome_pages_badge_id_fkey";
            columns: ["badge_id"];
            isOneToOne: false;
            referencedRelation: "badges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "welcome_pages_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "welcome_pages_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      welcome_page_claims: {
        Row: {
          id: string;
          welcome_page_id: string;
          user_id: string;
          claimed_at: string;
        };
        Insert: {
          id?: string;
          welcome_page_id: string;
          user_id: string;
          claimed_at?: string;
        };
        Update: {
          id?: string;
          welcome_page_id?: string;
          user_id?: string;
          claimed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "welcome_page_claims_welcome_page_id_fkey";
            columns: ["welcome_page_id"];
            isOneToOne: false;
            referencedRelation: "welcome_pages";
            referencedColumns: ["id"];
          },
        ];
      };
      avatar_animals: {
        Row: {
          id: string;
          slug: string;
          name: string;
          image_url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          image_url: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          image_url?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      tara_tokens: {
        Row: {
          user_id: string;
          balance: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          balance?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          balance?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tara_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      token_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reason:
            | "check_in"
            | "hosting"
            | "daily_login"
            | "streak_bonus"
            | "milestone"
            | "purchase"
            | "badge_earned"
            | "first_event"
            | "admin_grant";
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          reason:
            | "check_in"
            | "hosting"
            | "daily_login"
            | "streak_bonus"
            | "milestone"
            | "purchase"
            | "badge_earned"
            | "first_event"
            | "admin_grant";
          reference_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          reason?:
            | "check_in"
            | "hosting"
            | "daily_login"
            | "streak_bonus"
            | "milestone"
            | "purchase"
            | "badge_earned"
            | "first_event"
            | "admin_grant";
          reference_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "token_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      shop_items: {
        Row: {
          id: string;
          slug: string;
          name: string;
          category: "accessory" | "animal" | "background" | "border" | "skin";
          image_url: string;
          preview_url: string | null;
          price: number;
          rarity: "common" | "uncommon" | "rare" | "legendary";
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          category: "accessory" | "animal" | "background" | "border" | "skin";
          image_url: string;
          preview_url?: string | null;
          price: number;
          rarity?: "common" | "uncommon" | "rare" | "legendary";
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          category?: "accessory" | "animal" | "background" | "border" | "skin";
          image_url?: string;
          preview_url?: string | null;
          price?: number;
          rarity?: "common" | "uncommon" | "rare" | "legendary";
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      user_inventory: {
        Row: {
          id: string;
          user_id: string;
          shop_item_id: string;
          purchased_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          shop_item_id: string;
          purchased_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          shop_item_id?: string;
          purchased_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_inventory_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_inventory_shop_item_id_fkey";
            columns: ["shop_item_id"];
            isOneToOne: false;
            referencedRelation: "shop_items";
            referencedColumns: ["id"];
          },
        ];
      };
      user_avatar_config: {
        Row: {
          user_id: string;
          animal_id: string | null;
          equipped_accessory_id: string | null;
          equipped_background_id: string | null;
          equipped_border_id: string | null;
          equipped_skin_id: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          animal_id?: string | null;
          equipped_accessory_id?: string | null;
          equipped_background_id?: string | null;
          equipped_border_id?: string | null;
          equipped_skin_id?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          animal_id?: string | null;
          equipped_accessory_id?: string | null;
          equipped_background_id?: string | null;
          equipped_border_id?: string | null;
          equipped_skin_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_avatar_config_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_avatar_config_animal_id_fkey";
            columns: ["animal_id"];
            isOneToOne: false;
            referencedRelation: "avatar_animals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_avatar_config_equipped_accessory_id_fkey";
            columns: ["equipped_accessory_id"];
            isOneToOne: false;
            referencedRelation: "shop_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_avatar_config_equipped_background_id_fkey";
            columns: ["equipped_background_id"];
            isOneToOne: false;
            referencedRelation: "shop_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_avatar_config_equipped_border_id_fkey";
            columns: ["equipped_border_id"];
            isOneToOne: false;
            referencedRelation: "shop_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_avatar_config_equipped_skin_id_fkey";
            columns: ["equipped_skin_id"];
            isOneToOne: false;
            referencedRelation: "shop_items";
            referencedColumns: ["id"];
          },
        ];
      };
      qr_claim_batches: {
        Row: {
          id: string;
          badge_id: string;
          name: string;
          quantity: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          badge_id: string;
          name: string;
          quantity: number;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          badge_id?: string;
          name?: string;
          quantity?: number;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "qr_claim_batches_badge_id_fkey";
            columns: ["badge_id"];
            isOneToOne: false;
            referencedRelation: "badges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "qr_claim_batches_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      qr_claim_codes: {
        Row: {
          id: string;
          batch_id: string;
          token: string;
          serial_number: number;
          claimed_by: string | null;
          claimed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          token: string;
          serial_number: number;
          claimed_by?: string | null;
          claimed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          token?: string;
          serial_number?: number;
          claimed_by?: string | null;
          claimed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "qr_claim_codes_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "qr_claim_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "qr_claim_codes_claimed_by_fkey";
            columns: ["claimed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      club_rental_items: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          category:
            | "tent"
            | "sleeping_bag"
            | "trekking_poles"
            | "bike"
            | "helmet"
            | "backpack"
            | "other";
          description: string | null;
          rental_price: number;
          quantity_total: number;
          image_url: string | null;
          sizes: string[] | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          name: string;
          category:
            | "tent"
            | "sleeping_bag"
            | "trekking_poles"
            | "bike"
            | "helmet"
            | "backpack"
            | "other";
          description?: string | null;
          rental_price?: number;
          quantity_total?: number;
          image_url?: string | null;
          sizes?: string[] | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          name?: string;
          category?:
            | "tent"
            | "sleeping_bag"
            | "trekking_poles"
            | "bike"
            | "helmet"
            | "backpack"
            | "other";
          description?: string | null;
          rental_price?: number;
          quantity_total?: number;
          image_url?: string | null;
          sizes?: string[] | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "club_rental_items_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_rentals: {
        Row: {
          id: string;
          booking_id: string;
          rental_item_id: string;
          quantity: number;
          size: string | null;
          unit_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          rental_item_id: string;
          quantity?: number;
          size?: string | null;
          unit_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          rental_item_id?: string;
          quantity?: number;
          size?: string | null;
          unit_price?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_rentals_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_rentals_rental_item_id_fkey";
            columns: ["rental_item_id"];
            isOneToOne: false;
            referencedRelation: "club_rental_items";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      get_total_participants: {
        Args: { p_event_id: string };
        Returns: number;
      };
      claim_club: {
        Args: { p_token: string; p_user_id: string };
        Returns: Json;
      };
      award_tokens: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_reason: string;
          p_reference_id?: string;
        };
        Returns: number;
      };
      purchase_shop_item: {
        Args: {
          p_user_id: string;
          p_item_id: string;
        };
        Returns: Json;
      };
      claim_qr_code: {
        Args: { p_token: string; p_user_id: string };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
  };
}
