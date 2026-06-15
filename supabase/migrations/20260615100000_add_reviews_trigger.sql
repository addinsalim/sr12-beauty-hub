-- Function to update product rating and review count
CREATE OR REPLACE FUNCTION public.update_product_rating_and_count()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID;
  v_avg_rating NUMERIC(2,1);
  v_review_count INT;
BEGIN
  -- Determine the product ID to update
  IF TG_OP = 'DELETE' THEN
    v_product_id := OLD.product_id;
  ELSE
    v_product_id := NEW.product_id;
  END IF;

  -- Calculate average rating and count of reviews
  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0),
    COUNT(id)
  INTO 
    v_avg_rating,
    v_review_count
  FROM public.reviews
  WHERE product_id = v_product_id;

  -- Update the product
  UPDATE public.products
  SET 
    rating = v_avg_rating,
    review_count = v_review_count
  WHERE id = v_product_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on reviews table
DROP TRIGGER IF EXISTS tr_on_review_changed ON public.reviews;
CREATE TRIGGER tr_on_review_changed
AFTER INSERT OR UPDATE OR DELETE
ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_rating_and_count();

-- Recalculate for all existing products
UPDATE public.products p
SET 
  rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews r WHERE r.product_id = p.id), 0.0),
  review_count = COALESCE((SELECT COUNT(id) FROM public.reviews r WHERE r.product_id = p.id), 0);
