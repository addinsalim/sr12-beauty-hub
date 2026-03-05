
-- Fix: Change view to SECURITY INVOKER so it respects the querying user's permissions
ALTER VIEW public.products_public SET (security_invoker = on);
