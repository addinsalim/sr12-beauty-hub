import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderItem {
  product_id: string
  variant_id: string
  quantity: number
  price: number
}

interface CreateOrderRequest {
  items: OrderItem[]
  address_id: string
  shipping_cost: number
  payment_method: string // 'cod' | 'transfer_bank' | 'ewallet'
  payment_detail?: string // bank name or ewallet name
  notes?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body: CreateOrderRequest = await req.json()
    const { items, address_id, shipping_cost, payment_method, payment_detail, notes } = body

    // Validate input
    if (!items?.length) throw new Error('Keranjang kosong')
    if (!address_id) throw new Error('Alamat pengiriman harus dipilih')
    if (!payment_method) throw new Error('Metode pembayaran harus dipilih')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate stock
    for (const item of items) {
      const { data: variant, error } = await supabase
        .from('variants')
        .select('id, stock, name')
        .eq('id', item.variant_id)
        .single()
      
      if (error || !variant) throw new Error(`Varian produk tidak ditemukan`)
      if (variant.stock < item.quantity) {
        throw new Error(`Stok ${variant.name} tidak mencukupi (tersisa ${variant.stock})`)
      }
    }

    // Calculate totals
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const total = subtotal + (shipping_cost || 0)

    // Determine initial status
    const status = payment_method === 'cod' ? 'processing' : 'pending_payment'

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        address_id,
        subtotal,
        shipping_cost: shipping_cost || 0,
        total,
        status,
        notes: notes || null,
      })
      .select()
      .single()

    if (orderError) throw new Error(`Gagal membuat pesanan: ${orderError.message}`)

    // Create order items
    const orderItems = items.map(i => ({
      order_id: order.id,
      product_id: i.product_id,
      variant_id: i.variant_id,
      quantity: i.quantity,
      price: i.price,
      total: i.price * i.quantity,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) throw new Error(`Gagal menyimpan item pesanan: ${itemsError.message}`)

    // Reduce stock
    for (const item of items) {
      const { error: stockError } = await supabase.rpc('reduce_variant_stock', {
        p_variant_id: item.variant_id,
        p_quantity: item.quantity,
      })
      if (stockError) throw new Error(`Gagal mengurangi stok: ${stockError.message}`)
    }

    // Create payment record
    const { error: paymentError } = await supabase.from('payments').insert({
      order_id: order.id,
      amount: total,
      method: payment_method,
      bank_name: payment_detail || null,
      status: payment_method === 'cod' ? 'confirmed' : 'pending',
    })
    if (paymentError) throw new Error(`Gagal membuat pembayaran: ${paymentError.message}`)

    // Create notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Pesanan Dibuat',
      message: `Pesanan ${order.order_number} berhasil dibuat. Total: Rp${total.toLocaleString('id-ID')}`,
      type: 'order',
    })

    return new Response(JSON.stringify({ 
      success: true, 
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total: order.total,
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
