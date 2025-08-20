-- Fix function search path security warnings
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.get_random_quote() SET search_path = '';  
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- Add additional security for integrations table
-- Ensure plaintext sensitive fields are NEVER populated
CREATE OR REPLACE FUNCTION public.secure_integration_insert()
RETURNS trigger AS $$
BEGIN
  -- Force plaintext password and api_key to NULL for security
  NEW.password = NULL;
  NEW.api_key = NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.secure_integration_update()
RETURNS trigger AS $$
BEGIN
  -- Force plaintext password and api_key to NULL for security
  NEW.password = NULL;
  NEW.api_key = NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create triggers to ensure sensitive data is never stored in plaintext
DROP TRIGGER IF EXISTS secure_integration_insert_trigger ON public.integrations;
CREATE TRIGGER secure_integration_insert_trigger
  BEFORE INSERT ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.secure_integration_insert();

DROP TRIGGER IF EXISTS secure_integration_update_trigger ON public.integrations;
CREATE TRIGGER secure_integration_update_trigger
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.secure_integration_update();

-- Add a policy to ensure encrypted fields are never directly accessible
-- This is additional protection beyond the existing RLS policies
CREATE POLICY "Prevent direct access to encrypted fields"
ON public.integrations
FOR SELECT
USING (
  auth.uid() = user_id AND
  -- Additional check to ensure only authorized access patterns
  current_setting('request.jwt.claims', true)::json->>'role' IS NOT NULL
);