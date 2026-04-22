-- Create enum for event scope
CREATE TYPE public.event_scope AS ENUM ('Local', 'Regional', 'Nacional', 'Internacional');

-- Add alcance column to events table (nullable for backwards compatibility with existing rows)
ALTER TABLE public.events
ADD COLUMN alcance public.event_scope;