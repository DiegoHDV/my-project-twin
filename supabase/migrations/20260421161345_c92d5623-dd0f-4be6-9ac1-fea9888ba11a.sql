
-- Role enum
CREATE TYPE public.app_role AS ENUM ('organizer', 'sponsor');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role public.app_role NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  description TEXT DEFAULT '',
  event_types TEXT[] DEFAULT '{}',
  total_events INTEGER DEFAULT 0,
  social_links TEXT[] DEFAULT '{}',
  industry TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  budget_min INTEGER DEFAULT 0,
  budget_max INTEGER DEFAULT 0,
  preferred_activations TEXT[] DEFAULT '{}',
  rating NUMERIC(3,2) DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT DEFAULT '',
  date TIMESTAMPTZ,
  location TEXT DEFAULT '',
  capacity INTEGER DEFAULT 0,
  audience TEXT DEFAULT '',
  sector TEXT DEFAULT '',
  sponsorship_min INTEGER DEFAULT 0,
  sponsorship_max INTEGER DEFAULT 0,
  confirmed_sponsors TEXT[] DEFAULT '{}',
  media TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT false,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sponsor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, organizer_id, sponsor_id)
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  attachments TEXT[] DEFAULT '{}',
  seen BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX idx_events_published ON public.events(published);
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_sector ON public.events(sector);
CREATE INDEX idx_conversations_event_id ON public.conversations(event_id);
CREATE INDEX idx_conversations_organizer_id ON public.conversations(organizer_id);
CREATE INDEX idx_conversations_sponsor_id ON public.conversations(sponsor_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = _conversation_id
    AND (
      organizer_id = public.get_profile_id(_user_id)
      OR sponsor_id = public.get_profile_id(_user_id)
    )
  );
$$;

CREATE POLICY "Anyone authenticated can view profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Organizers can manage own events"
  ON public.events FOR ALL TO authenticated
  USING (organizer_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Sponsors can view published events"
  ON public.events FOR SELECT TO authenticated
  USING (published = true AND public.get_user_role(auth.uid()) = 'sponsor');
CREATE POLICY "Organizers can view all published events"
  ON public.events FOR SELECT TO authenticated
  USING (published = true AND public.get_user_role(auth.uid()) = 'organizer');

CREATE POLICY "Participants can view conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (public.is_conversation_participant(id, auth.uid()));
CREATE POLICY "Authenticated can create conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (
    organizer_id = public.get_profile_id(auth.uid())
    OR sponsor_id = public.get_profile_id(auth.uid())
  );

CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = public.get_profile_id(auth.uid())
    AND public.is_conversation_participant(conversation_id, auth.uid())
  );
CREATE POLICY "Participants can update messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

CREATE TYPE public.contact_request_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE public.contact_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.contact_request_status NOT NULL DEFAULT 'pending',
  message TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, sponsor_id)
);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sponsors can create contact requests"
  ON public.contact_requests FOR INSERT TO authenticated
  WITH CHECK (
    sponsor_id = public.get_profile_id(auth.uid())
    AND public.get_user_role(auth.uid()) = 'sponsor'::public.app_role
  );
CREATE POLICY "Participants can view contact requests"
  ON public.contact_requests FOR SELECT TO authenticated
  USING (
    sponsor_id = public.get_profile_id(auth.uid())
    OR organizer_id = public.get_profile_id(auth.uid())
  );
CREATE POLICY "Organizers can update contact requests"
  ON public.contact_requests FOR UPDATE TO authenticated
  USING (organizer_id = public.get_profile_id(auth.uid()))
  WITH CHECK (organizer_id = public.get_profile_id(auth.uid()));

CREATE TRIGGER update_contact_requests_updated_at
  BEFORE UPDATE ON public.contact_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_sectors text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS preferred_audiences text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS preferred_event_types text[] DEFAULT '{}'::text[];

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE TABLE public.saved_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, event_id)
);

ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved events"
  ON public.saved_events FOR SELECT TO authenticated
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can save events"
  ON public.saved_events FOR INSERT TO authenticated
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can unsave events"
  ON public.saved_events FOR DELETE TO authenticated
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE TABLE public.saved_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sponsor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, sponsor_id)
);

ALTER TABLE public.saved_sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can save sponsors"
  ON public.saved_sponsors FOR INSERT TO authenticated
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can unsave sponsors"
  ON public.saved_sponsors FOR DELETE TO authenticated
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own saved sponsors"
  ON public.saved_sponsors FOR SELECT TO authenticated
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
