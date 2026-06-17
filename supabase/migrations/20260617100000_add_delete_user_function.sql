CREATE OR REPLACE FUNCTION public.delete_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if the current executing user is an admin or owner
  IF NOT (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'owner')
  ) THEN
    RAISE EXCEPTION 'Hanya administrator yang dapat menghapus akun pengguna.';
  END IF;

  -- Ensure the admin cannot delete their own account
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'Anda tidak dapat menghapus akun Anda sendiri.';
  END IF;

  -- Delete the user from auth.users (cascades to profiles, user_roles, addresses, recently_viewed, wishlists, etc.)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;
