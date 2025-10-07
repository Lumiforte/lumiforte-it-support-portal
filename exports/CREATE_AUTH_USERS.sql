-- ================================================================================
-- CREATE AUTH USERS - LUMIFORTE HELPDESK
-- Dit script maakt alle 11 users aan in auth.users
-- Tijdelijk wachtwoord voor alle users: TempPass123!
-- ================================================================================

-- BELANGRIJK: Alle users moeten hun wachtwoord resetten na de eerste login!

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
VALUES
  -- 1. Jeroen privé
  (
    '00000000-0000-0000-0000-000000000000',
    '20016dbd-9aaa-47eb-a978-91d82c8e95aa',
    'authenticated',
    'authenticated',
    'vrieselaar.jeroen@gmail.com',
    crypt('TempPass123!', gen_salt('bf')),
    NOW(),
    '{"full_name": "Jeroen privé"}'::jsonb,
    '2025-10-04 11:28:59.873945+00',
    NOW(),
    '',
    ''
  ),
  
  -- 2. Jeroen Vrieselaar
  (
    '00000000-0000-0000-0000-000000000000',
    '9d291f14-093d-4356-a5c7-075813ca47ae',
    'authenticated',
    'authenticated',
    'jeroen.vrieselaar@lumiforte.com',
    crypt('TempPass123!', gen_salt('bf')),
    NOW(),
    '{"full_name": "Jeroen Vrieselaar"}'::jsonb,
    '2025-10-04 19:57:39.51961+00',
    NOW(),
    '',
    ''
  ),
  
  -- 3. Pietje Puk
  (
    '00000000-0000-0000-0000-000000000000',
    '63707620-c4c0-4bb0-bd4b-b48331aff0d3',
    'authenticated',
    'authenticated',
    'pietje@lumiforte.dev',
    crypt('TempPass123!', gen_salt('bf')),
    NOW(),
    '{"full_name": "Pietje Puk"}'::jsonb,
    '2025-10-04 20:13:24.676776+00',
    NOW(),
    '',
    ''
  ),
  
  -- 4. Kees Jansma
  (
    '00000000-0000-0000-0000-000000000000',
    'ba4a6c0d-bd90-41e3-922e-dfdaea86e2fe',
    'authenticated',
    'authenticated',
    'test1@lumiforte.dev',
    crypt('TempPass123!', gen_salt('bf')),
    NOW(),
    '{"full_name": "Kees Jansma"}'::jsonb,
    '2025-10-05 06:48:14.441001+00',
    NOW(),
    '',
    ''
  ),
  
  -- 5. Bas Moeskops
  (
    '00000000-0000-0000-0000-000000000000',
    '6b602d09-b90b-48f3-aebd-38772baee4b4',
    'authenticated',
    'authenticated',
    'test2@lumiforte.dev',
    crypt('TempPass123!', gen_salt('bf')),
    NOW(),
    '{"full_name": "Bas Moeskops"}'::jsonb,
    '2025-10-05 06:51:14.160249+00',
    NOW(),
    '',
    ''
  ),
  
  -- 6. Jort Gerritsen
  (
    '00000000-0000-0000-0000-000000000000',
    '7a265c0c-33b0-4a1e-af16-207b6b72eff8',
    'authenticated',
    'authenticated',
    'jort.gerritsen@lumiforte.com',
    crypt('TempPass123!', gen_salt('bf')),
    NOW(),
    '{"full_name": "Jort Gerritsen"}'::jsonb,
    '2025-10-06 09:25:36.911715+00',
    NOW(),
    '',
    ''
  ),
  
  -- 7. Michel Kooiman
  (
    '00000000-0000-0000-0000-000000000000',
    '95e616b0-ebf2-483f-8bd9-c4ab9fcaa03c',
    'authenticated',
    'authenticated',
    'michel.kooiman@lumiforte.com',
    crypt('TempPass123!', gen_salt('bf')),
    NOW(),
    '{"full_name": "Michel Kooiman"}'::jsonb,
    '2025-10-06 09:43:54.398279+00',
    NOW(),
    '',
    ''
  ),
  
  -- 8. Jort Ger
  (
    '00000000-0000-0000-0000-000000000000',
    'db5d20aa-8a6f-4806-8df4-5f9f54a60c2c',
    'authenticated',
    'authenticated',
    'jortger@gmail.com',
    crypt('TempPass123!', gen_salt('bf')),
    NOW(),
    '{"full_name": "Jort Ger"}'::jsonb,
    '2025-10-06 10:00:13.566987+00',
    NOW(),
    '',
    ''
  ),
  
  -- 9. Carlo Reinacher
  (
    '00000000-0000-0000-0000-000000000000',
    '85d91fbf-a7d2-48e0-875f-31129e3f77ad',
    'authenticated',
    'authenticated',
    'carlo.reinacher@lumiforte.com',
    crypt('TempPass123!', gen_salt('bf')),
    NOW(),
    '{"full_name": "Carlo Reinacher"}'::jsonb,
    '2025-10-06 11:54:23.036634+00',
    NOW(),
    '',
    ''
  ),
  
  -- 10. Erika van der Woude
  (
    '00000000-0000-0000-0000-000000000000',
    '7b5b7a80-3ba3-4025-b68d-b9288409292e',
    'authenticated',
    'authenticated',
    'erika.vanderwoude@lumiforte.com',
    crypt('TempPass123!', gen_salt('bf')),
    NOW(),
    '{"full_name": "Erika van der Woude"}'::jsonb,
    '2025-10-06 12:53:09.989746+00',
    NOW(),
    '',
    ''
  ),
  
  -- 11. Jeroen Bruers
  (
    '00000000-0000-0000-0000-000000000000',
    '6fa1de90-3572-4dc1-9f6b-2ee314e02d19',
    'authenticated',
    'authenticated',
    'jeroen.bruers@lumiforte.com',
    crypt('TempPass123!', gen_salt('bf')),
    NOW(),
    '{"full_name": "Jeroen Bruers"}'::jsonb,
    '2025-10-07 11:53:32.563671+00',
    NOW(),
    '',
    ''
  );

-- ================================================================================
-- VERIFICATIE
-- ================================================================================

-- Check hoeveel users er nu zijn:
SELECT COUNT(*) as total_users FROM auth.users;

-- Bekijk alle aangemaakte users:
SELECT id, email, raw_user_meta_data->>'full_name' as full_name, created_at 
FROM auth.users 
ORDER BY created_at;

-- ================================================================================
-- BELANGRIJK!
-- ================================================================================
-- Tijdelijk wachtwoord voor ALLE users: TempPass123!
-- 
-- Alle users moeten hun wachtwoord resetten bij de eerste login.
-- Je kunt dit forceren door password reset emails te sturen of door
-- een password reset flow te implementeren in je applicatie.
-- ================================================================================
