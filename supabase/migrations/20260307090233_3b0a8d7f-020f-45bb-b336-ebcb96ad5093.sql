-- Function to reduce stock atomically after order
CREATE OR REPLACE FUNCTION public.reduce_variant_stock(p_variant_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.variants
  SET stock = stock - p_quantity
  WHERE id = p_variant_id AND stock >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for variant %', p_variant_id;
  END IF;
END;
$$;

-- Function to restore stock when order is cancelled
CREATE OR REPLACE FUNCTION public.restore_variant_stock(p_variant_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.variants
  SET stock = stock + p_quantity
  WHERE id = p_variant_id;
END;
$$;