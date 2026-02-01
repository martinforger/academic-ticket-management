-- SQL to fix missing profile for existing user and promote to admin

-- 1. Insert missing profiles from auth.users
INSERT INTO public.profiles (id, email, role, initials, full_name)
SELECT 
    id, 
    email, 
    'administrador', -- Set default role to admin for this fix
    UPPER(SUBSTRING(email FROM 1 FOR 2)), 
    raw_user_meta_data->>'full_name'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 2. If the profile already existed but wasn't admin, update it (Optional, assuming you want YOUR user to be admin)
-- Replace 'YOUR_EMAIL@EXAMPLE.COM' with your actual email if needed, or this updates everyone who is currently a lector to admin (use with caution in prod, but fine for dev/single user)
UPDATE public.profiles
SET role = 'administrador'
WHERE role = 'lector';
