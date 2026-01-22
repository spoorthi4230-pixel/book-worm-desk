-- Add UNIQUE constraint and format validation for USN
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_usn_unique UNIQUE (usn);

-- Add CHECK constraint for USN format validation (server-side)
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_usn_format 
  CHECK (usn ~ '^[0-9]{1}[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$');

-- Add INSERT policy for user_roles so users can have their role assigned during registration
CREATE POLICY "Allow insert own role during signup"
ON public.user_roles
FOR INSERT
WITH CHECK (user_id = auth.uid());