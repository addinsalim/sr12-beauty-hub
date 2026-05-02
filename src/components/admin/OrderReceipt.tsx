import { forwardRef } from 'react';
import { formatPrice } from '@/lib/supabaseHelpers';

interface PackingSlipProps {
  order: any;
}

/**
 * Packing Slip / Struk Pesanan — untuk tim pack-packing
 * Dicetak saat window.print() dipanggil, tersembunyi di layar normal
 */
const PackingSlip = forwardRef<HTMLDivElement, PackingSlipProps>(({ order }, ref) => {
  if (!order) return null;

  const address = order.addresses;
  const payment = order.payments?.[0];
  const shipment = order.shipments?.[0];
  const profile = order.profile;
  const items = order.order_items || [];

  const statusLabel: Record<string, string> = {
    pending_payment: 'Menunggu Pembayaran',
    processing: 'Siap Dikemas',
    shipped: 'Sudah Dikirim',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  };

  const now = new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const orderDate = new Date(order.created_at).toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div
      ref={ref}
      className="print-receipt"
      style={{
        display: 'none',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#000',
        backgroundColor: '#fff',
        padding: '16px',
        maxWidth: '210mm',
      }}
    >
      {/* ══ HEADER ══ */}
      <table style={{ width: '100%', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '12px' }}>
        <tbody>
          <tr>
            <td>
              <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px' }}>SR12 BEAUTY HUB</div>
              <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>Toko Kecantikan Terpercaya • www.sr12-beauty-hub.com</div>
            </td>
            <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', border: '2px solid #000', padding: '4px 12px', display: 'inline-block' }}>
                SURAT PACKING
              </div>
              <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>Cetak: {now}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══ INFO PESANAN ══ */}
      <table style={{ width: '100%', marginBottom: '12px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '16px' }}>
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 'bold', paddingBottom: '3px', width: '110px' }}>No. Pesanan</td>
                    <td style={{ fontWeight: 'bold', fontSize: '13px' }}>: {order.order_number}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '3px' }}>Tanggal Order</td>
                    <td>: {orderDate}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '3px' }}>Status</td>
                    <td>
                      : <span style={{ fontWeight: 'bold', border: '1px solid #000', padding: '1px 6px' }}>
                        {statusLabel[order.status] || order.status}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '3px' }}>Pembayaran</td>
                    <td>: {payment?.method?.toUpperCase() || '-'}{payment?.bank_name ? ` (${payment.bank_name})` : ''}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '3px' }}>Status Bayar</td>
                    <td>: <span style={{ fontWeight: 'bold' }}>{payment?.status === 'confirmed' ? '✓ LUNAS' : payment?.status === 'pending' ? 'BELUM LUNAS' : (payment?.status || '-')}</span></td>
                  </tr>
                  {shipment && (
                    <>
                      <tr>
                        <td style={{ paddingBottom: '3px' }}>Kurir</td>
                        <td>: <span style={{ fontWeight: 'bold' }}>{shipment.courier?.toUpperCase()}</span></td>
                      </tr>
                      <tr>
                        <td style={{ paddingBottom: '3px' }}>No. Resi</td>
                        <td>: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{shipment.tracking_number}</span></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </td>

            <td style={{ width: '50%', verticalAlign: 'top' }}>
              {/* Alamat tujuan dalam kotak */}
              <div style={{ border: '2px solid #000', padding: '8px', height: '100%' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📦 Dikirim Kepada:
                </div>
                {address ? (
                  <>
                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{address.recipient_name}</div>
                    <div style={{ marginTop: '2px' }}>📞 {address.phone}</div>
                    <div style={{ marginTop: '4px', lineHeight: '1.5' }}>{address.full_address}</div>
                    <div>{[address.district, address.city, address.province].filter(Boolean).join(', ')}</div>
                    {address.postal_code && <div>Kode Pos: {address.postal_code}</div>}
                  </>
                ) : (
                  <div style={{ color: '#888' }}>Alamat tidak tersedia</div>
                )}
                <div style={{ marginTop: '6px', fontSize: '10px', borderTop: '1px dashed #ccc', paddingTop: '4px' }}>
                  Pengirim: SR12 BEAUTY HUB
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══ DAFTAR PRODUK ══ */}
      <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '4px', borderBottom: '1px solid #000', paddingBottom: '3px' }}>
        DAFTAR PRODUK YANG DIKEMAS
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '11px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center', width: '30px' }}>No</th>
            <th style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'left' }}>Nama Produk</th>
            <th style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center', width: '60px' }}>Varian</th>
            <th style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center', width: '50px' }}>Qty</th>
            <th style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'right', width: '90px' }}>Harga</th>
            <th style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'right', width: '90px' }}>Subtotal</th>
            <th style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center', width: '60px' }}>✓ Cek</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any, idx: number) => (
            <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center' }}>{idx + 1}</td>
              <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontWeight: 'bold' }}>
                {item.products?.name || 'Produk'}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center', fontSize: '10px' }}>
                {item.variants?.name || '-'}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                {item.quantity}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right' }}>
                {formatPrice(Number(item.price))}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                {formatPrice(Number(item.total))}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center', fontSize: '16px' }}>
                □
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ══ RINGKASAN HARGA ══ */}
      <table style={{ width: '100%', marginBottom: '16px' }}>
        <tbody>
          <tr>
            <td style={{ width: '55%', verticalAlign: 'top', paddingRight: '12px' }}>
              {/* Instruksi packing */}
              <div style={{ border: '1px dashed #aaa', padding: '8px', fontSize: '10px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📋 INSTRUKSI PACKING:</div>
                <div>□ Pastikan semua produk sesuai daftar</div>
                <div>□ Periksa kondisi produk (tidak bocor/rusak)</div>
                <div>□ Kemas dengan bubble wrap / kardus</div>
                <div>□ Tempel label pengiriman dengan benar</div>
                <div>□ Foto paket sebelum diserahkan kurir</div>
                {order.notes && (
                  <div style={{ marginTop: '6px', borderTop: '1px dashed #aaa', paddingTop: '4px', color: '#c00', fontWeight: 'bold' }}>
                    ⚠️ Catatan: {order.notes}
                  </div>
                )}
              </div>
            </td>
            <td style={{ width: '45%', verticalAlign: 'top' }}>
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '3px 8px' }}>Subtotal Produk</td>
                    <td style={{ padding: '3px 8px', textAlign: 'right' }}>{formatPrice(Number(order.subtotal))}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 8px' }}>Ongkos Kirim</td>
                    <td style={{ padding: '3px 8px', textAlign: 'right' }}>
                      {Number(order.shipping_cost) === 0 ? 'GRATIS' : formatPrice(Number(order.shipping_cost))}
                    </td>
                  </tr>
                  {order.discount_amount > 0 && (
                    <tr>
                      <td style={{ padding: '3px 8px', color: '#006600' }}>Diskon</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', color: '#006600' }}>
                        -{formatPrice(Number(order.discount_amount))}
                      </td>
                    </tr>
                  )}
                  <tr style={{ backgroundColor: '#000', color: '#fff' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', fontSize: '13px' }}>TOTAL</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                      {formatPrice(Number(order.total))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══ TTD & FOOTER ══ */}
      <table style={{ width: '100%', borderTop: '1px solid #ccc', paddingTop: '10px', marginTop: '10px', fontSize: '10px' }}>
        <tbody>
          <tr>
            <td style={{ textAlign: 'center', width: '33%' }}>
              <div>Dikemas oleh,</div>
              <div style={{ height: '40px', borderBottom: '1px solid #000', margin: '6px 20px' }} />
              <div>Nama & Tanda Tangan</div>
            </td>
            <td style={{ textAlign: 'center', width: '33%' }}>
              <div>Diperiksa oleh,</div>
              <div style={{ height: '40px', borderBottom: '1px solid #000', margin: '6px 20px' }} />
              <div>Nama & Tanda Tangan</div>
            </td>
            <td style={{ textAlign: 'center', width: '33%' }}>
              <div>Diserahkan ke Kurir,</div>
              <div style={{ height: '40px', borderBottom: '1px solid #000', margin: '6px 20px' }} />
              <div>Nama & Tanda Tangan</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '9px', color: '#888', borderTop: '1px dashed #ddd', paddingTop: '6px' }}>
        SR12 Beauty Hub — Dokumen ini dicetak otomatis dari sistem. Pelanggan: {profile?.full_name || 'Customer'} | Pesanan: {order.order_number}
      </div>
    </div>
  );
});

PackingSlip.displayName = 'PackingSlip';
export default PackingSlip;
