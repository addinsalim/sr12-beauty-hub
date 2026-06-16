// @ts-nocheck
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
  payment_method: string
  payment_detail?: string
  notes?: string
  shipping_method: 'local' | 'zone'
}

type Resolved = {
  product_id: string
  variant_id: string | null
  quantity: number
  unit_price: number
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

async function resolvePricing(
  supabase: any,
  items: OrderItem[],
): Promise<Resolved[]> {
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

      let unitPrice = Number(variant.price) || 0
      if (unitPrice === 0) {
        const { data: product } = await supabase
          .from('products')
          .select('price, discount')
          .eq('id', item.product_id)
          .single()
        if (product) {
          const discount = Number(product.discount) || 0
          unitPrice = Math.round(Number(product.price) * (1 - discount / 100))
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
        .select('id, stock, name, price, discount')
        .eq('id', item.product_id)
        .single()
      if (error || !product) throw new Error('Produk tidak ditemukan')
      if (product.stock < item.quantity) {
        throw new Error(`Stok ${product.name} tidak mencukupi (tersisa ${product.stock})`)
      }
      const discount = Number(product.discount) || 0
      const unitPrice = Math.round(Number(product.price) * (1 - discount / 100))

      resolved.push({
        product_id: item.product_id,
        variant_id: null,
        quantity: item.quantity,
        unit_price: unitPrice,
      })
    }
  }

  return resolved
}

async function deductStock(
  supabase: any,
  resolved: Resolved[],
) {
  for (const item of resolved) {
    if (item.variant_id) {
      const { error } = await supabase.rpc('reduce_variant_stock', {
        p_variant_id: item.variant_id,
        p_quantity: item.quantity,
      })
      if (error) throw new Error(`Gagal mengurangi stok varian: ${error.message}`)
    } else {
      const { error } = await supabase.rpc('reduce_product_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      })
      if (error) throw new Error(`Gagal mengurangi stok produk: ${error.message}`)
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401)

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) return jsonResponse({ error: 'Unauthorized' }, 401)

    const body: CreateOrderRequest = await req.json()
    const { items, address_id, payment_method, payment_detail, notes, shipping_method } = body

    // Validasi input
    if (!items?.length) throw new Error('Keranjang kosong')
    if (items.length > 50) throw new Error('Terlalu banyak item')
    if (!address_id) throw new Error('Alamat pengiriman harus dipilih')
    if (!payment_method) throw new Error('Metode pembayaran harus dipilih')
    if (!shipping_method) throw new Error('Metode pengiriman harus dipilih')

    for (const i of items) {
      if (!i.product_id || !Number.isInteger(i.quantity) || i.quantity <= 0 || i.quantity > 1000) {
        throw new Error('Jumlah item tidak valid')
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verifikasi alamat milik user, ambil koordinat dan provinsi
    const { data: addr, error: addrErr } = await supabase
      .from('addresses')
      .select('id, user_id, latitude, longitude, province')
      .eq('id', address_id)
      .single()
    if (addrErr || !addr || addr.user_id !== user.id) {
      throw new Error('Alamat tidak valid')
    }

    // Ambil konfigurasi shipping
    const { data: config } = await supabase
      .from('shipping_configs')
      .select('*')
      .maybeSingle()

    // Cek status keaktifan metode pengiriman
    if (shipping_method === 'local') {
      if (config && !config.local_delivery_active) {
        throw new Error('Layanan pengantaran lokal (Antar Toko) sedang tidak aktif.')
      }
    } else if (shipping_method === 'zone') {
      if (config && !config.zone_shipping_active) {
        throw new Error('Layanan pengiriman zona sedang tidak aktif.')
      }
    } else {
      throw new Error('Metode pengiriman tidak valid.')
    }

    // Hitung jarak jika koordinat tersedia
    const storeLat = config ? Number(config.store_lat) : -6.7027
    const storeLng = config ? Number(config.store_lng) : 107.5645
    let distance: number | null = null
    if (addr.latitude !== null && addr.longitude !== null) {
      distance = getDistance(storeLat, storeLng, Number(addr.latitude), Number(addr.longitude))
    }

    if (shipping_method === 'local') {
      if (distance === null) {
        throw new Error('Lokasi alamat pengiriman tidak ditentukan di peta. Harap tentukan lokasi untuk pengantaran lokal.')
      }
      if (distance > 10) {
        throw new Error(`Jarak alamat pengiriman (${distance.toFixed(1)} km) melebihi batas maksimal pengantaran lokal (10 km).`)
      }
    }

    // Cek COD keaktifan & batasan
    if (payment_method === 'cod') {
      if (config && !config.cod_active) {
        throw new Error('Metode pembayaran COD sedang tidak aktif.')
      }
      if (shipping_method !== 'local') {
        throw new Error('Metode COD hanya tersedia untuk pengantaran lokal (Antar Toko).')
      }
      if (distance === null || distance > 10) {
        throw new Error('Metode COD hanya tersedia dalam radius maksimal 10 km.')
      }
    }

    // Hitung harga di server (jangan percaya client)
    const resolved = await resolvePricing(supabase, items)
    const subtotal = resolved.reduce((s, i) => s + i.unit_price * i.quantity, 0)

    // Cek minimal belanja COD
    if (payment_method === 'cod') {
      const minPurchase = config ? Number(config.cod_min_purchase) : 50000
      if (subtotal < minPurchase) {
        throw new Error(`Minimal pembelian untuk metode COD adalah Rp${minPurchase.toLocaleString('id-ID')}`)
      }
    }

    // Hitung biaya pengiriman
    let shipping_cost = 20000
    if (subtotal >= 200000) {
      shipping_cost = 0
    } else {
      if (shipping_method === 'local') {
        if (distance !== null) {
          if (distance <= 3) shipping_cost = 5000
          else if (distance <= 5) shipping_cost = 10000
          else if (distance <= 10) shipping_cost = 15000
        } else {
          shipping_cost = 20000
        }
      } else {
        // zone-based shipping
        if (addr.province) {
          const cleanProvince = addr.province.trim().toLowerCase()
          const { data: zones } = await supabase.from('shipping_zones').select('*')
          if (zones && zones.length) {
            const matched = zones.find((z: any) =>
              z.provinces.some((p: string) => p.trim().toLowerCase() === cleanProvince)
            )
            if (matched) {
              shipping_cost = Number(matched.cost)
            }
          }
        }
      }
    }

    const total = subtotal + shipping_cost
    const status = payment_method === 'cod' ? 'processing' : 'pending_payment'

    // Buat order
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
        shipping_method,
      })
      .select()
      .single()
    if (orderError) throw new Error(`Gagal membuat pesanan: ${orderError.message}`)

    // Insert items
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

    // Kurangi stok atomically
    await deductStock(supabase, resolved)

    // Buat payment record
    const { error: paymentError } = await supabase.from('payments').insert({
      order_id: order.id,
      amount: total,
      method: payment_method,
      bank_name: payment_detail || null,
      status: payment_method === 'cod' ? 'confirmed' : 'pending',
    })
    if (paymentError) throw new Error(`Gagal membuat pembayaran: ${paymentError.message}`)

    // Buat shipment record
    const courierName = shipping_method === 'local' ? 'Kurir Toko' : 'Reguler'
    const { error: shipmentError } = await supabase.from('shipments').insert({
      order_id: order.id,
      courier: courierName,
      status: 'pending',
    })
    if (shipmentError) {
      throw new Error(`Gagal membuat data pengiriman: ${shipmentError.message}`)
    }

    // Notifikasi
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Pesanan Dibuat',
      message: `Pesanan ${order.order_number} berhasil dibuat. Total: Rp${total.toLocaleString('id-ID')}`,
      type: 'order',
    })

    return jsonResponse({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total: order.total,
        subtotal,
        shipping_cost,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan'
    console.error('create-order error:', message)
    return jsonResponse({ error: message }, 400)
  }
})
