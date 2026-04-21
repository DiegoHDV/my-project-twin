UPDATE public.events SET media = ARRAY[
  CASE lower(coalesce(sector,''))
    WHEN 'música' THEN 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80'
    WHEN 'tecnología' THEN 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80'
    WHEN 'deportes' THEN 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=80'
    WHEN 'gastronomía' THEN 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=80'
    WHEN 'cultura' THEN 'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=1200&q=80'
    WHEN 'moda' THEN 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80'
    WHEN 'startups' THEN 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80'
    WHEN 'educación' THEN 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80'
    ELSE 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80'
  END
]
WHERE published = true;