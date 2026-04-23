import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderItem {
  product_id: string
  variant_id?: string | null
  quantity: number
}

interface CreateOrderRequest {
  items: OrderItem[]
  address_id: string
  payment_method: string // 'cod' | 'transfer_bank' | 'ewallet'
  payment_detail?: string
  notes?: string
}

// Server-side shipping rule (ignore client-supplied value)
function calculateShipping(subtotal: number): number {
  if (subtotal >= 200000) return 0
  return 20000
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('create-order called, user:', user.id)

    const body: CreateOrderRequest = await req.json()
    const { items, address_id, payment_method, payment_detail, notes } = body

    if (!items?.length) throw new Error('Keranjang kosong')
    if (!address_id) throw new Error('Alamat pengiriman harus dipilih')
    if (!payment_method) throw new Error('Metode pembayaran harus dipilih')

    // Validate quantities
    for (const i of items) {
      if (!i.product_id || !Number.isInteger(i.quantity) || i.quantity <= 0 || i.quantity > 1000) {
        throw new Error('Jumlah item tidak valid')
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Determine if user is reseller (for pricing tier)
    const { data: resellerRoleRows } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'reseller')
    const isReseller = !!resellerRoleRows && resellerRoleRows.length > 0

    // Validate stock + fetch SERVER-side prices (never trust client)
    type Resolved = { product_id: string; variant_id: string | null; quantity: number; unit_price: number }
    const resolved: Resolved[] = []

    for (const item of items) {
      if (item.variant_id) {
        const { data: variant, error } = await supabase
          .from('variants')
          .select('id, stock, name, price, product_id')
          .eq('id', item.variant_id)
          .single()
        if (error || !variant) throw new Error('Varian produk tidak ditemukan')
        if (variant.product_id !== item.product_id) throw new Error('Varian tidak cocok dengan produk')
        if (variant.stock < item.quantity) {
          throw new Error(`Stok ${variant.name} tidak mencukupi (tersisa ${variant.stock})`)
        }

        // For reseller pricing fall back to product if variant has no special price
        let unitPrice = Number(variant.price) || 0
        if (isReseller || unitPrice === 0) {
          const { data: product } = await supabase
            .from('products')
            .select('price, reseller_price, discount')
            .eq('id', item.product_id)
            .single()
          if (product) {
            const base = isReseller && product.reseller_price > 0
              ? Number(product.reseller_price)
              : (unitPrice > 0 ? unitPrice : Number(product.price))
            const discount = Number(product.discount) || 0
            unitPrice = Math.round(base * (1 - discount / 100))
          }
        }

        resolved.push({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: unitPrice,
        })
      } else {
        const { data: product, error } = await supabase
          .from('products')
          .select('id, stock, name, price, reseller_price, discount')
          .eq('id', item.product_id)
          .single()
        if (error || !product) throw new Error('Produk tidak ditemukan')
        if (product.stock < item.quantity) {
          throw new Error(`Stok ${product.name} tidak mencukupi (tersisa ${product.stock})`)
        }
        const base = isReseller && product.reseller_price > 0
          ? Number(product.reseller_price)
          : Number(product.price)
        const discount = Number(product.discount) || 0
        const unitPrice = Math.round(base * (1 - discount / 100))

        resolved.push({
          product_id: item.product_id,
          variant_id: null,
          quantity: item.quantity,
          unit_price: unitPrice,
        })
      }
    }

    // Server-side totals
    const subtotal = resolved.reduce((s, i) => s + i.unit_price * i.quantity, 0)
    const shipping_cost = calculateShipping(subtotal)
    const total = subtotal + shipping_cost

    const status = payment_method === 'cod' ? 'processing' : 'pending_payment'

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        address_id,
        subtotal,
        shipping_cost,
        total,
        status,
        notes: notes || null,
      })
      .select()
      .single()

    if (orderError) throw new Error(`Gagal membuat pesanan: ${orderError.message}`)

    const orderItems = resolved.map(i => ({
      order_id: order.id,
      product_id: i.product_id,
      variant_id: i.variant_id,
      quantity: i.quantity,
      price: i.unit_price,
      total: i.unit_price * i.quantity,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) throw new Error(`Gagal menyimpan item pesanan: ${itemsError.message}`)

    for (const item of resolved) {
      if (item.variant_id) {
        const { error: stockError } = await supabase.rpc('reduce_variant_stock', {
          p_variant_id: item.variant_id,
          p_quantity: item.quantity,
        })
        if (stockError) throw new Error(`Gagal mengurangi stok: ${stockError.message}`)
      } else {
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single()
        if (fetchError || !product) throw new Error(`Gagal mengambil stok produk`)
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: product.stock - item.quantity })
          .eq('id', item.product_id)
        if (stockError) throw new Error(`Gagal mengurangi stok: ${stockError.message}`)
      }
    }

    const { error: paymentError } = await supabase.from('payments').insert({
      order_id: order.id,
      amount: total,
      method: payment_method,
      bank_name: payment_detail || null,
      status: payment_method === 'cod' ? 'confirmed' : 'pending',
    })
    if (paymentError) throw new Error(`Gagal membuat pembayaran: ${paymentError.message}`)

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
        subtotal,
        shipping_cost,
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan'
    console.error('create-order error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
