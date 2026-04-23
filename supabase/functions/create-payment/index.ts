import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const midtransServerKey = Deno.env.get('MIDTRANS_SERVER_KEY')!
    const midtransBaseUrl = Deno.env.get('MIDTRANS_BASE_URL') || 'https://app.sandbox.midtrans.com'

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

    const { order_id } = await req.json()
    if (!order_id) throw new Error('order_id diperlukan')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Ambil data order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) throw new Error('Pesanan tidak ditemukan')
    if (!['pending_payment'].includes(order.status)) {
      throw new Error('Pesanan ini tidak perlu pembayaran')
    }

    // Ambil item pesanan
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('*, products:product_id(name)')
      .eq('order_id', order_id)

    // Ambil profil user
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('user_id', user.id)
      .maybeSingle()

    // Siapkan item details untuk Midtrans
    const itemDetails = (orderItems || []).map((item: any) => ({
      id: item.product_id,
      price: Math.round(item.price),
      quantity: item.quantity,
      name: (item.products?.name || 'Produk').substring(0, 50),
    }))

    // Tambah ongkos kirim sebagai item
    if (order.shipping_cost > 0) {
      itemDetails.push({
        id: 'SHIPPING',
        price: Math.round(order.shipping_cost),
        quantity: 1,
        name: 'Ongkos Kirim',
      })
    }

    // Payload Midtrans Snap
    const snapPayload = {
      transaction_details: {
        order_id: order.id, // pakai UUID order sebagai Midtrans order_id
        gross_amount: Math.round(order.total),
      },
      customer_details: {
        first_name: profile?.full_name || user.email?.split('@')[0] || 'Customer',
        email: user.email,
        phone: profile?.phone || '',
      },
      item_details: itemDetails,
      callbacks: {
        finish: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:8080'}/orders/${order.id}`,
      },
    }

    // Panggil Midtrans Snap API
    const midtransAuth = btoa(`${midtransServerKey}:`)
    const midtransRes = await fetch(`${midtransBaseUrl}/snap/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${midtransAuth}`,
      },
      body: JSON.stringify(snapPayload),
    })

    const midtransData = await midtransRes.json()

    if (!midtransRes.ok || !midtransData.token) {
      console.error('Midtrans error:', midtransData)
      throw new Error(midtransData.error_messages?.join(', ') || 'Gagal membuat transaksi Midtrans')
    }

    return new Response(JSON.stringify({
      snap_token: midtransData.token,
      redirect_url: midtransData.redirect_url,
      order_number: order.order_number,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan'
    console.error('create-payment error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
