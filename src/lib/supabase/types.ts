export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          full_name: string
          username: string | null
          avatar_url: string | null
          role: 'organizer' | 'participant' | 'guest'
          is_guest: boolean
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name: string
          username?: string | null
          avatar_url?: string | null
          role?: 'organizer' | 'participant' | 'guest'
          is_guest?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string
          username?: string | null
          avatar_url?: string | null
          role?: 'organizer' | 'participant' | 'guest'
          is_guest?: boolean
          created_at?: string
        }
        Relationships: []
      }
      organizer_profiles: {
        Row: {
          id: string
          user_id: string
          org_name: string
          description: string | null
          logo_url: string | null
          payment_info: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          org_name: string
          description?: string | null
          logo_url?: string | null
          payment_info?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          org_name?: string
          description?: string | null
          logo_url?: string | null
          payment_info?: Json
          created_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          organizer_id: string
          title: string
          description: string | null
          type: 'hiking' | 'mtb' | 'road_bike' | 'running' | 'trail_run'
          date: string
          location: string
          coordinates: unknown | null
          max_participants: number
          price: number
          status: 'draft' | 'published' | 'completed' | 'cancelled'
          cover_image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          title: string
          description?: string | null
          type: 'hiking' | 'mtb' | 'road_bike' | 'running' | 'trail_run'
          date: string
          location: string
          coordinates?: unknown | null
          max_participants?: number
          price?: number
          status?: 'draft' | 'published' | 'completed' | 'cancelled'
          cover_image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          title?: string
          description?: string | null
          type?: 'hiking' | 'mtb' | 'road_bike' | 'running' | 'trail_run'
          date?: string
          location?: string
          coordinates?: unknown | null
          max_participants?: number
          price?: number
          status?: 'draft' | 'published' | 'completed' | 'cancelled'
          cover_image_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      event_photos: {
        Row: {
          id: string
          event_id: string
          image_url: string
          caption: string | null
          sort_order: number
          uploaded_at: string
        }
        Insert: {
          id?: string
          event_id: string
          image_url: string
          caption?: string | null
          sort_order?: number
          uploaded_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          image_url?: string
          caption?: string | null
          sort_order?: number
          uploaded_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: 'pending' | 'confirmed' | 'cancelled'
          payment_status: 'pending' | 'paid' | 'rejected' | 'refunded'
          payment_method: 'gcash' | 'maya' | 'cash' | null
          payment_proof_url: string | null
          payment_verified_at: string | null
          payment_verified_by: string | null
          qr_code: string | null
          booked_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status?: 'pending' | 'confirmed' | 'cancelled'
          payment_status?: 'pending' | 'paid' | 'rejected' | 'refunded'
          payment_method?: 'gcash' | 'maya' | 'cash' | null
          payment_proof_url?: string | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          qr_code?: string | null
          booked_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          status?: 'pending' | 'confirmed' | 'cancelled'
          payment_status?: 'pending' | 'paid' | 'rejected' | 'refunded'
          payment_method?: 'gcash' | 'maya' | 'cash' | null
          payment_proof_url?: string | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          qr_code?: string | null
          booked_at?: string
        }
        Relationships: []
      }
      booking_companions: {
        Row: {
          id: string
          booking_id: string
          full_name: string
          phone: string | null
          qr_code: string | null
          checked_in: boolean
          checked_in_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          full_name: string
          phone?: string | null
          qr_code?: string | null
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          full_name?: string
          phone?: string | null
          qr_code?: string | null
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          id: string
          event_id: string
          title: string
          description: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          title: string
          description?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          awarded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          awarded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          awarded_at?: string
        }
        Relationships: []
      }
      event_checkins: {
        Row: {
          id: string
          event_id: string
          user_id: string
          checked_in_at: string
          method: 'qr' | 'manual'
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          checked_in_at?: string
          method?: 'qr' | 'manual'
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          checked_in_at?: string
          method?: 'qr' | 'manual'
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_total_participants: {
        Args: { p_event_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
