UPDATE public.events
SET media = ARRAY['/events/techsummit-madrid.jpg']::text[],
    updated_at = now()
WHERE organizer_id = 'd2d4283d-0be7-4e7a-bbb1-687cc1164bfd'
  AND title = 'TechSummit Madrid 2026 — Match 100%';