-- Remove plaintext credential columns from integrations table
-- These are security risks and the encrypted versions should be used instead

-- Drop the plaintext credential columns
ALTER TABLE public.integrations DROP COLUMN IF EXISTS password;
ALTER TABLE public.integrations DROP COLUMN IF EXISTS api_key;

-- Drop the security triggers since the columns no longer exist
DROP TRIGGER IF EXISTS secure_integration_insert_trigger ON public.integrations;
DROP TRIGGER IF EXISTS secure_integration_update_trigger ON public.integrations;

-- Drop the security functions since they're no longer needed
DROP FUNCTION IF EXISTS public.secure_integration_insert();
DROP FUNCTION IF EXISTS public.secure_integration_update();

-- Update the integration service select queries to exclude the dropped columns
-- Note: The application code will need to be updated to not reference these fields