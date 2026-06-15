-- Create function to check if email exists in auth.users
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
  );
END;
$$;

-- Grant execution permissions to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon, authenticated;
