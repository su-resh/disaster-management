-- Insert disaster types
insert into disaster_types (name) values
  ('flood'),
  ('landslide'),
  ('earthquake'),
  ('fire'),
  ('storm'),
  ('avalanche'),
  ('accident'),
  ('other')
on conflict (name) do nothing;

-- Insert severity levels
insert into severity_levels (name, rank, color_hint) values
  ('critical', 1, '#FF0000'), -- Red
  ('high', 2, '#FF8C00'),   -- Dark Orange
  ('medium', 3, '#FFFF00'), -- Yellow
  ('low', 4, '#00FF00')     -- Green
on conflict (name) do nothing;

-- Insert resource types with sensible units
insert into resource_types (name, category, unit, is_expiry_tracked, default_minimum_stock) values
  ('water', 'water', 'bottle', false, 100),
  ('food', 'food', 'kg', true, 50),
  ('medicine', 'medical', 'box', true, 30),
  ('tents', 'shelter', 'piece', false, 20),
  ('blankets', 'shelter', 'piece', false, 50),
  ('clothes', 'shelter', 'piece', false, 30),
  ('first_aid', 'medical', 'box', true, 20),
  ('flashlights', 'equipment', 'piece', false, 15),
  ('batteries', 'equipment', 'piece', false, 40),
  ('rescue_equipment', 'equipment', 'piece', false, 10),
  ('fuel', 'equipment', 'liter', false, 200),
  ('other', 'other', 'piece', false, 0)
on conflict (name) do nothing;