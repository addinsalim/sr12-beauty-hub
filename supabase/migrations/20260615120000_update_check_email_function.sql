-- Update check_email_exists to be case-insensitive and ignore leading/trailing whitespace
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE LOWER(TRIM(email)) = LOWER(TRIM(p_email))
  );
END;
$$;
