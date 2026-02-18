-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('organizer', 'participant', 'guest')),
  is_guest BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organizer profiles
CREATE TABLE public.organizer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  org_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  payment_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES public.organizer_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('hiking', 'mtb', 'road_bike', 'running', 'trail_run')),
  date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  coordinates POINT,
  max_participants INT NOT NULL DEFAULT 50,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed', 'cancelled')),
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Event photo gallery
CREATE TABLE public.event_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('gcash', 'maya')),
  qr_code TEXT,
  booked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Badges
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id)
);

-- User badge collection
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Event check-ins
CREATE TABLE public.event_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  method TEXT NOT NULL DEFAULT 'qr' CHECK (method IN ('qr', 'manual')),
  UNIQUE(event_id, user_id)
);

-- Indexes for common queries
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_type ON public.events(type);
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_bookings_event ON public.bookings(event_id);
CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX idx_event_checkins_event ON public.event_checkins(event_id);
CREATE INDEX idx_event_photos_event ON public.event_photos(event_id);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: anyone can read public profiles, users can update their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.users
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Organizer profiles: anyone can read, owners can manage
CREATE POLICY "Organizer profiles are viewable by everyone" ON public.organizer_profiles
  FOR SELECT USING (true);
CREATE POLICY "Organizers can manage own profile" ON public.organizer_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Events: published events visible to all, organizers manage their own
CREATE POLICY "Published events are viewable by everyone" ON public.events
  FOR SELECT USING (status = 'published' OR organizer_id IN (
    SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
  ));
CREATE POLICY "Organizers can manage own events" ON public.events
  FOR ALL USING (organizer_id IN (
    SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
  ));

-- Event photos: viewable if event is published, organizer can manage
CREATE POLICY "Event photos viewable with event" ON public.event_photos
  FOR SELECT USING (event_id IN (
    SELECT id FROM public.events WHERE status = 'published'
  ));
CREATE POLICY "Organizers can manage event photos" ON public.event_photos
  FOR ALL USING (event_id IN (
    SELECT id FROM public.events WHERE organizer_id IN (
      SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
    )
  ));

-- Bookings: users see own bookings, organizers see bookings for their events
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Organizers can view event bookings" ON public.bookings
  FOR SELECT USING (event_id IN (
    SELECT id FROM public.events WHERE organizer_id IN (
      SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
    )
  ));
CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Badges: viewable by everyone, managed by organizer
CREATE POLICY "Badges are viewable by everyone" ON public.badges
  FOR SELECT USING (true);
CREATE POLICY "Organizers can manage badges" ON public.badges
  FOR ALL USING (event_id IN (
    SELECT id FROM public.events WHERE organizer_id IN (
      SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
    )
  ));

-- User badges: viewable by everyone (public profiles), awarded by organizer
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges
  FOR SELECT USING (true);
CREATE POLICY "Organizers can award badges" ON public.user_badges
  FOR INSERT WITH CHECK (badge_id IN (
    SELECT b.id FROM public.badges b
    JOIN public.events e ON b.event_id = e.id
    WHERE e.organizer_id IN (
      SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
    )
  ));

-- Check-ins: users see own, organizers see for their events
CREATE POLICY "Users can view own checkins" ON public.event_checkins
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Organizers can view event checkins" ON public.event_checkins
  FOR SELECT USING (event_id IN (
    SELECT id FROM public.events WHERE organizer_id IN (
      SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
    )
  ));
CREATE POLICY "Users can check in" ON public.event_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Adventurer'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
