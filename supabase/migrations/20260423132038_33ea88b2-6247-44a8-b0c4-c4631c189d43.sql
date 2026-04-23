INSERT INTO public.events (
  organizer_id, title, description, type, date, location,
  latitude, longitude, audience, capacity, sector,
  sponsorship_min, sponsorship_max, published, media
) VALUES (
  'd2d4283d-0be7-4e7a-bbb1-687cc1164bfd',
  'TechSummit Madrid 2026 — Match 100%',
  'Conferencia premium de tecnología y startups en Madrid, pensada para profesionales 25-40 y emprendedores. Evento diseñado para encajar al 100% con sponsors tech.',
  'Conferencia',
  (now() + interval '45 days'),
  'Madrid',
  40.4168, -3.7038,
  'Profesionales 25-40',
  1500,
  'Tecnología',
  10000, 30000,
  true,
  ARRAY[]::text[]
);