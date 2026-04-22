DO $$
DECLARE
  imgs TEXT[] := ARRAY[
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=80',
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&q=80',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&q=80',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
    'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=1200&q=80',
    'https://images.unsplash.com/photo-1496337589254-7e19d01cec44?w=1200&q=80',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80',
    'https://images.unsplash.com/photo-1485872299829-c673f5194813?w=1200&q=80',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80',
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&q=80',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80',
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&q=80',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&q=80',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&q=80',
    'https://images.unsplash.com/photo-1559223607-a43c990c692c?w=1200&q=80',
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&q=80',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80',
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&q=80',
    'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=1200&q=80',
    'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1200&q=80',
    'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=1200&q=80',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
    'https://images.unsplash.com/photo-1517457210348-703079e57d4b?w=1200&q=80',
    'https://images.unsplash.com/photo-1534705867302-2a41394d2a3b?w=1200&q=80',
    'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80',
    'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=1200&q=80',
    'https://images.unsplash.com/photo-1535359056830-d4badde79747?w=1200&q=80',
    'https://images.unsplash.com/photo-1574391884720-bbc049ec09ad?w=1200&q=80',
    'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=1200&q=80',
    'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1200&q=80',
    'https://images.unsplash.com/photo-1533219346818-fb182cb3a1cf?w=1200&q=80',
    'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?w=1200&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80',
    'https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?w=1200&q=80',
    'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=1200&q=80',
    'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1200&q=80',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&q=80',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=80',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&q=80',
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=80',
    'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1200&q=80',
    'https://images.unsplash.com/photo-1567942712661-82b9b407abbf?w=1200&q=80',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80',
    'https://images.unsplash.com/photo-1558008258-3256797b43f3?w=1200&q=80'
  ];
  doubled TEXT[];
  shuffled TEXT[];
  ev RECORD;
  i INT := 1;
BEGIN
  -- Each image twice => 100 slots for 100 events
  doubled := imgs || imgs;
  -- Shuffle
  SELECT array_agg(x ORDER BY random()) INTO shuffled FROM unnest(doubled) AS x;

  FOR ev IN SELECT id FROM events ORDER BY created_at LOOP
    UPDATE events SET media = ARRAY[shuffled[i]] WHERE id = ev.id;
    i := i + 1;
  END LOOP;
END $$;