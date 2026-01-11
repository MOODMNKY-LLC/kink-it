-- =====================================================
-- UPDATE SYSTEM KINKSTERS WITH SPECIALTIES
-- Assigns unique specialties to each system kinkster
-- Created: 2026-02-15
-- =====================================================

-- 1. Master Seraphina - Protocol & Etiquette Training
UPDATE public.kinksters
SET
  specialty = 'Protocol & Etiquette Training',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000002'::uuid
  AND is_system_kinkster = true;

-- 2. Luna the Brat - Brat Taming & Funishment
UPDATE public.kinksters
SET
  specialty = 'Brat Taming & Funishment',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000003'::uuid
  AND is_system_kinkster = true;

-- 3. Daddy Marcus - Caregiving & Aftercare
UPDATE public.kinksters
SET
  specialty = 'Caregiving & Aftercare',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000004'::uuid
  AND is_system_kinkster = true;

-- 4. Fenrir - Primal Play & Wrestling
UPDATE public.kinksters
SET
  specialty = 'Primal Play & Wrestling',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000005'::uuid
  AND is_system_kinkster = true;

-- 5. Ari the Devoted - Service Submission & Worship
UPDATE public.kinksters
SET
  specialty = 'Service Submission & Worship',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000006'::uuid
  AND is_system_kinkster = true;

-- 6. Kinky Kincade - General Guidance & Education
UPDATE public.kinksters
SET
  specialty = 'General Guidance & Education',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
  AND is_system_kinkster = true;
