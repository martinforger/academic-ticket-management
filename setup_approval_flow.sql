-- SQL to add 'sin_asignar' role and update default behavior

-- 1. Add new value to Enum
-- Note: 'ALTER TYPE ... ADD VALUE' cannot run inside a transaction block in some tools,
-- but standard Supabase SQL editor handles it fine.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sin_asignar';

-- 2. Update the trigger function to default to 'sin_asignar' instead of 'lector'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, initials, full_name)
  VALUES (
    new.id, 
    new.email, 
    'sin_asignar', -- CHANGED FROM 'lector'
    upper(substring(new.email from 1 for 2)), 
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. (Optional) Set existing 'lector' users to 'sin_asignar' if you want to force approval for them too
-- UPDATE public.profiles SET role = 'sin_asignar' WHERE role = 'lector';
