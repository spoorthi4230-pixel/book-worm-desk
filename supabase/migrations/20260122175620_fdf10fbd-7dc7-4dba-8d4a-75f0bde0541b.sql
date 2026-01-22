-- Create app role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    usn TEXT NOT NULL,
    phone TEXT,
    photo_id_path TEXT,
    photo_id_status TEXT DEFAULT 'pending' CHECK (photo_id_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add trigger to profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for photo IDs (private bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('photo-ids', 'photo-ids', false);

-- Storage policies for photo-ids bucket
-- Users can upload their own photo ID (path must be user_id/filename)
CREATE POLICY "Users can upload their own photo ID"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'photo-ids' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own photo ID
CREATE POLICY "Users can view their own photo ID"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'photo-ids' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own photo ID
CREATE POLICY "Users can update their own photo ID"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'photo-ids' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own photo ID
CREATE POLICY "Users can delete their own photo ID"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'photo-ids' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all photo IDs for verification
CREATE POLICY "Admins can view all photo IDs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'photo-ids' 
    AND public.has_role(auth.uid(), 'admin')
);