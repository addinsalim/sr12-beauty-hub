import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper: SHA512 hash
async function sha512(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-512', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const midtransServerKey = Deno.env.get('MIDTRANS_SERVER_KEY')!

    const body = await req.json()
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = body

    // Verifikasi signature Midtrans
    // signature = SHA512(order_id + status_code + gross_amount + server_key)
    const expectedSignature = await sha512(`${order_id}${status_code}${gross_amount}${midtransServerKey}`)
    if (signature_key !== expectedSignature) {
      console.error('Invalid signature. Expected:', expectedSignature, 'Got:', signature_key)
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Tentukan status berdasarkan notifikasi Midtrans
    let paymentStatus: string
    let orderStatus: string

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      // Pembayaran berhasil
      if (fraud_status === 'challenge') {
        paymentStatus = 'pending' // perlu review manual
        orderStatus = 'pending_payment'
      } else {
        paymentStatus = 'confirmed'
        orderStatus = 'processing'
      }
    } else if (transaction_status === 'pending') {
      paymentStatus = 'pending'
      orderStatus = 'pending_payment'
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'expire' ||
      transaction_status === 'cancel' ||
      transaction_status === 'failure'
    ) {
      paymentStatus = 'failed'
      orderStatus = 'cancelled'
    } else {
      paymentStatus = 'pending'
      orderStatus = 'pending_payment'
    }

    // Update tabel payments
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        method: payment_type || 'midtrans',
        confirmed_at: paymentStatus === 'confirmed' ? new Date().toISOString() : null,
      })
      .eq('order_id', order_id)

    if (paymentError) {
      console.error('Error updating payment:', paymentError)
    }

    // Update tabel orders
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id)

    if (orderError) {
      console.error('Error updating order:', orderError)
    }

    // Kirim notifikasi ke user jika pembayaran berhasil
    if (paymentStatus === 'confirmed') {
      const { data: order } = await supabase
        .from('orders')
        .select('user_id, order_number, total')
        .eq('id', order_id)
        .single()

      if (order) {
        await supabase.from('notifications').insert({
          user_id: order.user_id,
          title: 'Pembayaran Dikonfirmasi',
          message: `Pembayaran pesanan ${order.order_number} sebesar Rp${Number(order.total).toLocaleString('id-ID')} telah dikonfirmasi. Pesanan Anda sedang diproses.`,
          type: 'payment',
        })
      }
    }

    return new Response(JSON.stringify({ received: true, status: paymentStatus }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan'
    console.error('midtrans-webhook error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
