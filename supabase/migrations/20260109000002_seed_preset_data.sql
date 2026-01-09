-- Seed Preset Data for Image Studio
-- This migration seeds initial character and scene presets

-- Character Presets (use gen_random_uuid() for auto-generated IDs)
INSERT INTO public.character_presets (name, description, image_url, storage_path, props, tags)
VALUES (
  'KINKSTER Model',
  'Default KINKSTER character model - muscular bara style',
  '/images/presets/characters/kinkster-model.png',
  'characters/kinkster-model.png',
  '{"physical": {"build": "muscular"}}',
  ARRAY['bara', 'muscular', 'default']
)
ON CONFLICT DO NOTHING;

-- Scene Presets
INSERT INTO public.scene_presets (name, description, image_url, storage_path, background_type, tags)
VALUES 
  (
    'Slum Bar',
    'Neon-lit underground bar scene with Welcome to the Slum signage',
    '/images/presets/scenes/slum-bar.png',
    'scenes/slum-bar.png',
    'scene',
    ARRAY['indoor', 'bar', 'neon', 'cyberpunk', 'urban']
  ),
  (
    'Graffiti City',
    'Colorful outdoor cityscape with graffiti-covered buildings',
    '/images/presets/scenes/graffiti-city.png',
    'scenes/graffiti-city.png',
    'environment',
    ARRAY['outdoor', 'city', 'graffiti', 'colorful', 'urban']
  ),
  (
    'Orc Tavern',
    'Chaotic indoor tavern scene with fantasy creatures',
    '/images/presets/scenes/orc-tavern.png',
    'scenes/orc-tavern.png',
    'scene',
    ARRAY['indoor', 'tavern', 'fantasy', 'chaotic', 'food']
  )
ON CONFLICT DO NOTHING;

-- Background Presets (same as scene presets for now)
INSERT INTO public.background_presets (name, description, type, storage_path, thumbnail_url, tags)
VALUES 
  (
    'Slum Bar',
    'Neon-lit underground bar scene with Welcome to the Slum signage',
    'scene',
    'scenes/slum-bar.png',
    '/images/presets/scenes/slum-bar.png',
    ARRAY['indoor', 'bar', 'neon', 'cyberpunk', 'urban']
  ),
  (
    'Graffiti City',
    'Colorful outdoor cityscape with graffiti-covered buildings',
    'environment',
    'scenes/graffiti-city.png',
    '/images/presets/scenes/graffiti-city.png',
    ARRAY['outdoor', 'city', 'graffiti', 'colorful', 'urban']
  ),
  (
    'Orc Tavern',
    'Chaotic indoor tavern scene with fantasy creatures',
    'scene',
    'scenes/orc-tavern.png',
    '/images/presets/scenes/orc-tavern.png',
    ARRAY['indoor', 'tavern', 'fantasy', 'chaotic', 'food']
  )
ON CONFLICT DO NOTHING;
