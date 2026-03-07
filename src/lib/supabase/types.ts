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
          user_id: string | null;
          org_name: string;
          description: string | null;
          logo_url: string | null;
          payment_info: Json;
          claim_token: string | null;
          claim_expires_at: string | null;
          is_claimed: boolean;
          pending_username: string | null;
          is_demo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string | null;
          org_name: string;
          description?: string | null;
          logo_url?: string | null;
          payment_info?: Json;
          claim_token?: string | null;
          claim_expires_at?: string | null;
          is_claimed?: boolean;
          pending_username?: string | null;
          is_demo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          org_name?: string;
          description?: string | null;
          logo_url?: string | null;
          payment_info?: Json;
          claim_token?: string | null;
          claim_expires_at?: string | null;
          is_claimed?: boolean;
          pending_username?: string | null;
          is_demo?: boolean;
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
          is_featured: boolean;
          is_demo: boolean;
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
          is_featured?: boolean;
          is_demo?: boolean;
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
          is_featured?: boolean;
          is_demo?: boolean;
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
          activity_type: "booking" | "checkin" | "badge" | "border";
          activity_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: "booking" | "checkin" | "badge" | "border";
          activity_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: "booking" | "checkin" | "badge" | "border";
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
          activity_type: "booking" | "checkin" | "badge" | "border";
          activity_id: string;
          emoji: "heart";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: "booking" | "checkin" | "badge" | "border";
          activity_id: string;
          emoji: "heart";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: "booking" | "checkin" | "badge" | "border";
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
          activity_type: "booking" | "checkin" | "badge" | "border";
          activity_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: "booking" | "checkin" | "badge" | "border";
          activity_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: "booking" | "checkin" | "badge" | "border";
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
            | "feed_mention";
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
            | "feed_mention";
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
            | "feed_mention";
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
          organizer_reviews: boolean;
          events_two_col_mobile: boolean;
          show_coming_soon: boolean;
          ewallet_payments: boolean;
          oauth_strava: boolean;
          oauth_facebook: boolean;
        };
        Insert: {
          id?: number;
          activity_feed?: boolean;
          strava_showcase_features?: boolean;
          strava_showcase_stats?: boolean;
          strava_showcase_route_map?: boolean;
          organizer_reviews?: boolean;
          events_two_col_mobile?: boolean;
          show_coming_soon?: boolean;
          ewallet_payments?: boolean;
          oauth_strava?: boolean;
          oauth_facebook?: boolean;
        };
        Update: {
          id?: number;
          activity_feed?: boolean;
          strava_showcase_features?: boolean;
          strava_showcase_stats?: boolean;
          strava_showcase_route_map?: boolean;
          organizer_reviews?: boolean;
          events_two_col_mobile?: boolean;
          show_coming_soon?: boolean;
          ewallet_payments?: boolean;
          oauth_strava?: boolean;
          oauth_facebook?: boolean;
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
          strava_route_id: number | null;
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
          strava_route_id?: number | null;
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
          strava_route_id?: number | null;
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
      organizer_reviews: {
        Row: {
          id: string;
          organizer_id: string;
          user_id: string;
          rating: number;
          text: string | null;
          is_anonymous: boolean;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organizer_id: string;
          user_id: string;
          rating: number;
          text?: string | null;
          is_anonymous?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organizer_id?: string;
          user_id?: string;
          rating?: number;
          text?: string | null;
          is_anonymous?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizer_review_photos: {
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
