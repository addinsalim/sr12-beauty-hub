// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Fallback Biteship key provided by the user
const FALLBACK_BITESHIP_KEY = "biteship_live.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoic3IxMnB1cndha2FydGFzdG9yZSIsInVzZXJJZCI6IjZhMzNhNTFjMzdiOWY3Y2M5YzQ1YjJmZCIsImlhdCI6MTc4MTc2OTk0OX0.FmWPB_xHCsrI8Hgmi96MO__-4XlPZsc7tyCPUy_Orbk";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const biteshipKey = Deno.env.get('BITESHIP_API_KEY') || FALLBACK_BITESHIP_KEY;

    // Authenticate the user calling the function
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401)

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) return jsonResponse({ error: 'Unauthorized' }, 401)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await req.json()
    const { action } = body

    if (action === 'get-rates') {
      const { address_id, items } = body
      if (!address_id) throw new Error('Alamat pengiriman harus dipilih')
      if (!items || items.length === 0) throw new Error('Item belanjaan kosong')

      // Get customer address
      const { data: addr, error: addrErr } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', address_id)
        .eq('user_id', user.id)
        .single()
      if (addrErr || !addr) throw new Error('Alamat tidak ditemukan atau tidak valid')

      if (addr.latitude === null || addr.longitude === null) {
        throw new Error('Alamat terpilih belum di-pin lokasi pada peta.')
      }

      // Get shipping configurations (store origin coordinates)
      const { data: config } = await supabase
        .from('shipping_configs')
        .select('*')
        .maybeSingle()

      const originLat = config ? Number(config.store_lat) : -6.7027
      const originLng = config ? Number(config.store_lng) : 107.5645

      // Resolve products weight and value
      const biteshipItems = []
      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('name, description, weight, price, discount')
          .eq('id', item.productId)
          .single()

        const name = product?.name || item.name || 'Produk Beauty Hub'
        const description = product?.description || name
        // default weight: 200g if null/empty
        const weight = product?.weight ? Number(product.weight) : 200
        const discount = product ? Number(product.discount) || 0 : 0
        const value = product ? Math.round(Number(product.price) * (1 - discount / 100)) : item.price

        biteshipItems.push({
          name: name.substring(0, 50),
          description: description.substring(0, 100),
          value: value * item.quantity,
          weight: weight * item.quantity,
          quantity: item.quantity
        })
      }

      // Request rates from Biteship API
      const biteshipBody = {
        origin_latitude: originLat,
        origin_longitude: originLng,
        destination_latitude: Number(addr.latitude),
        destination_longitude: Number(addr.longitude),
        couriers: 'jne,jnt,sicepat,tiki,pos,wahana',
        items: biteshipItems
      }

      const response = await fetch('https://api.biteship.com/v1/rates', {
        method: 'POST',
        headers: {
          'Authorization': biteshipKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(biteshipBody)
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('Biteship Rates API Error:', errText)
        throw new Error('Gagal mendapatkan tarif pengiriman dari Biteship.')
      }

      const resData = await response.json()
      if (!resData.success) {
        throw new Error(resData.message || 'Gagal menghitung tarif Biteship.')
      }

      // Extract pricing options
      const pricings = (resData.pricing || []).map((p: any) => ({
        id: `${p.courier_code}:${p.courier_service_code}`,
        courier_code: p.courier_code,
        courier_name: p.courier_name,
        service_code: p.courier_service_code,
        service_name: p.courier_service_name,
        description: p.description,
        duration: p.duration,
        cost: p.price
      }))

      return jsonResponse({ success: true, pricings })
    } 
    
    else if (action === 'create-shipment') {
      const { shipment_id } = body
      if (!shipment_id) throw new Error('Shipment ID harus disediakan')

      // Get shipment details
      const { data: shipment, error: shipErr } = await supabase
        .from('shipments')
        .select('*, orders(*, order_items(*, products(*)), addresses(*))')
        .eq('id', shipment_id)
        .single()

      if (shipErr || !shipment) throw new Error('Data pengiriman tidak ditemukan')
      if (shipment.status === 'shipped' || shipment.status === 'delivered') {
        throw new Error('Pengiriman sudah diproses sebelumnya.')
      }

      const order = shipment.orders
      if (!order) throw new Error('Data pesanan tidak ditemukan')
      if (order.status !== 'processing') {
        throw new Error('Pesanan belum lunas atau belum dikonfirmasi.')
      }

      const addr = order.addresses
      if (!addr) throw new Error('Alamat pengiriman tidak ditemukan')

      // Check if courier format is correct (company:type)
      const courierRaw = shipment.courier || ''
      if (!courierRaw.includes(':')) {
        throw new Error(`Informasi kurir tidak valid (${courierRaw}). Harus berformat 'company:service' (contoh: jne:reg)`)
      }

      const [courierCompany, courierType] = courierRaw.split(':')

      // Get store origin config
      const { data: config } = await supabase
        .from('shipping_configs')
        .select('*')
        .maybeSingle()

      const originLat = config ? Number(config.store_lat) : -6.7027
      const originLng = config ? Number(config.store_lng) : 107.5645

      // Get user profile for phone
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone, full_name')
        .eq('user_id', order.user_id)
        .maybeSingle()

      // Resolve items
      const biteshipItems = []
      for (const item of order.order_items) {
        const prod = item.products
        const name = prod?.name || 'Produk Beauty Hub'
        const weight = prod?.weight ? Number(prod.weight) : 200
        biteshipItems.push({
          name: name.substring(0, 50),
          description: (prod?.description || name).substring(0, 100),
          value: Number(item.price) * item.quantity,
          weight: weight * item.quantity,
          quantity: item.quantity
        })
      }

      // Prepare Biteship Order Creation Body
      const biteshipBody = {
        shipper_contact_name: 'SR12 Beauty Hub',
        shipper_contact_phone: '08123456789',
        origin_contact_name: 'SR12 Beauty Hub',
        origin_contact_phone: '08123456789',
        origin_address: 'Wanayasa, Purwakarta',
        origin_coordinate: {
          latitude: originLat,
          longitude: originLng
        },
        destination_contact_name: addr.recipient_name,
        destination_contact_phone: addr.phone || profile?.phone || '08123456789',
        destination_address: `${addr.full_address}, ${addr.district ? addr.district + ', ' : ''}${addr.city}, ${addr.province} ${addr.postal_code || ''}`.substring(0, 190),
        destination_coordinate: {
          latitude: Number(addr.latitude),
          longitude: Number(addr.longitude)
        },
        courier_company: courierCompany,
        courier_type: courierType,
        delivery_type: 'now',
        items: biteshipItems
      }

      const response = await fetch('https://api.biteship.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': biteshipKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(biteshipBody)
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('Biteship Booking API Error:', errText)
        throw new Error('Gagal memproses pesanan kurir di Biteship.')
      }

      const resData = await response.json()
      if (!resData.success) {
        throw new Error(resData.message || 'Gagal memproses pesanan Biteship.')
      }

      const trackingNumber = resData.courier?.tracking_id || ''
      const biteshipOrderId = resData.id || ''
      const courierName = `${resData.courier?.company?.toUpperCase()} - ${resData.courier?.type?.toUpperCase()}`

      // Update shipment record
      const { error: updErr } = await supabase
        .from('shipments')
        .update({
          status: 'shipped',
          tracking_number: trackingNumber,
          courier_name: courierName,
          shipped_at: new Date().toISOString()
        })
        .eq('id', shipment_id)

      if (updErr) throw updErr

      // Update order status to shipped
      await supabase
        .from('orders')
        .update({ status: 'shipped', updated_at: new Date().toISOString() })
        .eq('id', order.id)

      // Insert notification
      await supabase.from('notifications').insert({
        user_id: order.user_id,
        title: 'Pesanan Dikirim',
        message: `Pesanan Anda ${order.order_number} sedang dikirim via ${courierName}. No. Resi: ${trackingNumber}`,
        type: 'order'
      })

      return jsonResponse({
        success: true,
        tracking_number: trackingNumber,
        biteship_order_id: biteshipOrderId,
        courier_name: courierName
      })
    } 
    
    else {
      throw new Error('Aksi tidak valid.')
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan'
    console.error('Biteship Edge Function Error:', message)
    return jsonResponse({ error: message }, 400)
  }
})
