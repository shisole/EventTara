-- Women's Month Hike for a Cause — Mt. Napulak
-- Club: Yenergy Outdoors (7e4f06f2-6523-4859-81e4-8af2a94a2312)

DO $$
DECLARE
  v_event_id uuid;
BEGIN
  -- Clear existing events and their related data for this club
  DELETE FROM bookings WHERE event_id IN (
    SELECT id FROM events WHERE club_id = '7e4f06f2-6523-4859-81e4-8af2a94a2312'
  );
  DELETE FROM events WHERE club_id = '7e4f06f2-6523-4859-81e4-8af2a94a2312';

  -- Create the event
  INSERT INTO events (
    club_id, title, description, type, date, location,
    max_participants, price, status, cover_image_url
  ) VALUES (
    '7e4f06f2-6523-4859-81e4-8af2a94a2312',
    'Women''s Month Hike for a Cause',
    'In celebration of Women''s Month, Yenergy Outdoors is organizing a Hike for a Cause where proceeds will help fund our upcoming outreach activity in Brgy. Bagay, Igbaras on March 28, 2026. The outreach aims to support women ages 15–30 through sexual and reproductive health education and the distribution of hygiene kits, empowering them with knowledge, care, and essential resources. Every step on this hike helps make a meaningful difference in the lives of the women we serve.',
    'hiking',
    '2026-03-22T05:00:00+08:00',
    'Mt. Napulak, Iloilo',
    50,
    0,
    'published',
    'https://pub-c9f0ffc1256143ae8a9ecc91dc23b8d8.r2.dev/events/covers/835a237a-999f-4191-bd4e-9b450c2fcc6d.jpeg'
  ) RETURNING id INTO v_event_id;

  -- Attach route (Strava)
  INSERT INTO event_routes (event_id, source, name, strava_route_id)
  VALUES (v_event_id, 'strava', 'Lingguhob Campsite', 3467575946256382810);

  -- Insert 45 participant bookings (manual entries, no user accounts needed)
  -- ⛰️ = fully paid, 🌱 = downpayment/reserved, unmarked = pending
  INSERT INTO bookings (event_id, status, payment_status, manual_status, manual_name, manual_contact) VALUES
    (v_event_id, 'confirmed', 'paid',    'paid',     'RJM Watimar',                'Sara, Iloilo'),
    (v_event_id, 'confirmed', 'pending', 'pending',  'Krystle Pañer',              'Leon, Iloilo'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Arneil Rey Mercado',         'Jaro, Iloilo City'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Cheryl Mae Calawigan',       'Leon, Iloilo'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Vivian Calawigan',           'Leon, Iloilo'),
    (v_event_id, 'confirmed', 'pending', 'reserved', 'Vanessa Calawigan',          'Leon, Iloilo'),
    (v_event_id, 'confirmed', 'pending', 'pending',  'Karl Hisole',                'Iloilo'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Geraldine Diesto',           'Iloilo City'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Jofer Watimar',              'Sara, Iloilo'),
    (v_event_id, 'confirmed', 'pending', 'pending',  'Stephen Antonio',            'Jaro, Iloilo City'),
    (v_event_id, 'confirmed', 'pending', 'pending',  'Gian Nicolas',               'Jaro, Iloilo'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Benjamin Ochea',             'Talima Lapu-Lapu City, Cebu'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Philline Dicar',             'Iloilo City'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Kent Lorenze Guzman',        'Maasin'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Joseph Lister Delfin',       'Sara, Iloilo'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Dessa Alter Delfin',         'Sara, Iloilo'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Govinda Dasi Wisniewski',    'Sara, Iloilo'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Erica Arbolonio',            'Lapaz, Iloilo City'),
    (v_event_id, 'confirmed', 'pending', 'reserved', 'Gerald Labiano',             'Oton, Iloilo'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Daphne Juntilla',            'Oton, Iloilo'),
    (v_event_id, 'confirmed', 'pending', 'reserved', 'Roj Escultero',              'Mandurriao, Iloilo City'),
    (v_event_id, 'confirmed', 'pending', 'pending',  'Danryl Galvan',              'City Proper, Iloilo City'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Jeric Bantad',               'Lapaz, Iloilo City'),
    (v_event_id, 'confirmed', 'pending', 'reserved', 'Reynan Basinillo',           'President Roxas, Capiz'),
    (v_event_id, 'confirmed', 'pending', 'reserved', 'Jhamer Capulot',             'Leon, Iloilo'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Lord Josef Pouillat',        'Iloilo City'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Ma. Lovel Cadiz',            'Iloilo City'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Jessebel Marie Cebal',       'Iloilo City'),
    (v_event_id, 'confirmed', 'pending', 'reserved', 'Daniela Savare',             'San Joaquin'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Mary Grace Labong',          'Iloilo City'),
    (v_event_id, 'confirmed', 'pending', 'reserved', 'Mykel Mondragon',            'San Joaquin'),
    (v_event_id, 'confirmed', 'pending', 'pending',  'AhL Loquiso',                'Jaro, Iloilo City'),
    (v_event_id, 'confirmed', 'pending', 'reserved', 'Jevy Joy Magcanam',          'Jaro, Iloilo City'),
    (v_event_id, 'confirmed', 'pending', 'pending',  'Vince Gerald',               'City Proper, Iloilo City'),
    (v_event_id, 'confirmed', 'pending', 'pending',  'Angelyn Herrera',            NULL),
    (v_event_id, 'confirmed', 'pending', 'pending',  'Ron Eliseo Molina',          NULL),
    (v_event_id, 'confirmed', 'pending', 'pending',  'Estaneslao Arbiz',           'Jaro, Iloilo'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Crislyn Astorga',            'Jaro, Iloilo'),
    (v_event_id, 'confirmed', 'pending', 'reserved', 'Chiralyn De Pablo',          'City Proper, Iloilo City'),
    (v_event_id, 'confirmed', 'pending', 'pending',  'Rocky Badana',               'Iloilo City'),
    (v_event_id, 'confirmed', 'pending', 'pending',  'Flonne Guzman',              'Janiuay, Iloilo'),
    (v_event_id, 'confirmed', 'pending', 'pending',  'Zyndyryn Villaraiz',         'Jaro, Iloilo'),
    (v_event_id, 'confirmed', 'pending', 'reserved', 'Jannine Faith Lizada',       'Jamindan, Capiz'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Diocel Ann Heria',           'Pavia, Iloilo'),
    (v_event_id, 'confirmed', 'paid',    'paid',     'Gwynneth Rivas',             'City Proper, Iloilo City');
END $$;
