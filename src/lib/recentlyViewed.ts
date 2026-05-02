import { supabase } from '@/integrations/supabase/client';

export async function trackRecentlyViewed(productId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('recently_viewed').upsert(
    { user_id: user.id, product_id: productId, viewed_at: new Date().toISOString() },
    { onConflict: 'user_id,product_id' }
  );
}
