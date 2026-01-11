-- =====================================================
-- UPDATE ALL SYSTEM KINKSTERS TO MALE
-- Changes pronouns, appearance, and descriptions to male
-- Created: 2026-02-15
-- =====================================================

-- 1. Update Mistress Seraphina to Master Seraphina (male)
UPDATE public.kinksters
SET
  name = 'Master Seraphina',
  display_name = 'Seraphina',
  pronouns = 'He/Him',
  facial_hair = 'trimmed beard',
  body_type = 'athletic',
  avatar_prompt = 'Portrait of a late 30s elegant man with raven black long flowing hair, piercing emerald green eyes, pale porcelain skin, athletic muscular build, 5''8", trimmed beard, wearing gothic elegant style clothing, sophisticated and commanding expression',
  generation_prompt = 'Portrait of a late 30s elegant man with raven black long flowing hair, piercing emerald green eyes, pale porcelain skin, athletic muscular build, 5''8", trimmed beard, wearing gothic elegant style clothing, sophisticated and commanding expression',
  appearance_description = 'A commanding figure in his late 30s, Seraphina stands at 5''8" with an athletic, muscular build that speaks to both strength and elegance. His raven black hair flows in long, elegant waves, framing a face with piercing emerald green eyes that seem to see through everything. His pale, porcelain skin contrasts beautifully with his dark aesthetic. A trimmed beard adds to his sophisticated appearance. He carries himself with regal poise, often dressed in elegant gothic attire—corsets, leather, and sophisticated formal wear in his signature colors: black, deep purple, and crimson red.',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000002'::uuid
  AND is_system_kinkster = true;

-- 2. Update Luna the Brat to male
UPDATE public.kinksters
SET
  pronouns = 'He/Him',
  facial_hair = 'light stubble',
  body_type = 'slim',
  avatar_prompt = 'Portrait of a mid 20s playful man with vibrant pink and purple short choppy asymmetrical hair, bright hazel eyes, fair freckled skin, slim athletic build, 5''2", light stubble, wearing punk playful style clothing, mischievous and energetic expression',
  generation_prompt = 'Portrait of a mid 20s playful man with vibrant pink and purple short choppy asymmetrical hair, bright hazel eyes, fair freckled skin, slim athletic build, 5''2", light stubble, wearing punk playful style clothing, mischievous and energetic expression',
  appearance_description = 'Luna is petite at 5''2" with a slim, athletic build that seems to contain boundless energy. His hair is a vibrant mix of hot pink and purple, cut in a short, choppy, asymmetrical style that matches his personality—unpredictable and bold. Bright hazel eyes sparkle with mischief, and his fair skin is dotted with freckles. Light stubble adds to his edgy look. He favors punk and alternative fashion: crop tops, fishnets, chokers, platform boots, and cute collars in his favorite colors—hot pink, purple, black, and neon green. His aesthetic is playful punk, always colorful and expressive.',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000003'::uuid
  AND is_system_kinkster = true;

-- 3. Daddy Marcus is already male - just ensure consistency
UPDATE public.kinksters
SET
  pronouns = 'He/Him',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000004'::uuid
  AND is_system_kinkster = true;

-- 4. Update Fenrir to male (was They/Them)
UPDATE public.kinksters
SET
  pronouns = 'He/Him',
  avatar_prompt = 'Portrait of a late 20s intense man with dark brown wild long untamed hair, intense amber eyes, olive tan skin, muscular athletic build, 5''10", scruffy beard, wearing primal raw style clothing, wild and intense expression',
  generation_prompt = 'Portrait of a late 20s intense man with dark brown wild long untamed hair, intense amber eyes, olive tan skin, muscular athletic build, 5''10", scruffy beard, wearing primal raw style clothing, wild and intense expression',
  appearance_description = 'Fenrir stands at 5''10" with a muscular, athletic build that speaks to his physical nature. His dark brown hair is long and wild, untamed and free, matching his personality. Intense amber eyes seem to see right through you, and his olive tan skin shows the marks of an active, outdoor lifestyle. A scruffy beard adds to his rugged appearance. He favors minimal, rugged clothing in earth tones—black, brown, rust, and natural colors. Leather harnesses and minimal clothing are common. His aesthetic is primal and raw—someone who looks like he could be a wolf in human form, radiating wild energy and untamed intensity.',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000005'::uuid
  AND is_system_kinkster = true;

-- 5. Update Aria the Devoted to male
UPDATE public.kinksters
SET
  name = 'Ari the Devoted',
  display_name = 'Ari',
  pronouns = 'He/Him',
  facial_hair = 'clean-shaven',
  body_type = 'slim',
  avatar_prompt = 'Portrait of a mid 20s graceful man with dark brown long elegant hair, soft brown eyes, warm olive skin, graceful slim build, 5''6", clean-shaven, wearing elegant service style clothing, gentle and devoted expression',
  generation_prompt = 'Portrait of a mid 20s graceful man with dark brown long elegant hair, soft brown eyes, warm olive skin, graceful slim build, 5''6", clean-shaven, wearing elegant service style clothing, gentle and devoted expression',
  appearance_description = 'Ari stands at 5''6" with a graceful, slim build that moves with elegance and purpose. His dark brown hair is long and elegant, often styled simply but beautifully. Soft brown eyes hold a gentle, devoted expression, and his warm olive skin glows with health. Clean-shaven, he maintains a refined appearance. He favors elegant, classic clothing in soft, refined colors: ivory, soft pink, lavender, and cream. His aesthetic is elegant service—someone who looks like he could be a classical musician or dancer, radiating grace, humility, and devotion.',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000006'::uuid
  AND is_system_kinkster = true;

-- Add comment
COMMENT ON COLUMN public.kinksters.pronouns IS 'Pronouns for the kinkster character. System kinksters are all male (He/Him).';
