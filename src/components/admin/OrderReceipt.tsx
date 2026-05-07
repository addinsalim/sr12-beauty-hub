import { forwardRef, useRef } from 'react';
import { Printer, X, Package, MapPin, CreditCard, Truck, FileText } from 'lucide-react';
import { formatPrice } from '@/lib/supabaseHelpers';
import { Button } from '@/components/ui/button';

interface OrderReceiptProps {
  order: any;
  onClose?: () => void;
}

/* ─── Komponen Struk (isi cetak) ────────────────────────────────── */
const ReceiptContent = forwardRef<HTMLDivElement, { order: any }>(({ order }, ref) => {
  if (!order) return null;

  const address  = order.addresses;
  const payment  = order.payments?.[0];
  const shipment = order.shipments?.[0];
  const profile  = order.profile;
  const items    = order.order_items || [];

  const statusLabel: Record<string, string> = {
    pending_payment : 'Menunggu Pembayaran',
    processing      : 'Siap Dikemas',
    shipped         : 'Sudah Dikirim',
    completed       : 'Selesai',
    cancelled       : 'Dibatalkan',
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
      id="receipt-printable"
      style={{
        fontFamily : 'Arial, Helvetica, sans-serif',
        fontSize   : '12px',
        color      : '#000',
        backgroundColor: '#fff',
        padding    : '20px',
        width      : '100%',
        maxWidth   : '800px',
        margin     : '0 auto',
      }}
    >
      {/* ══ HEADER ══ */}
      <table style={{ width: '100%', borderBottom: '2.5px solid #000', paddingBottom: '12px', marginBottom: '16px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td>
              <div style={{ fontSize: '22px', fontWeight: 'bold', letterSpacing: '2px', color: '#c0783c' }}>SR12 BEAUTY HUB</div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>Toko Kecantikan Terpercaya &bull; sr12-beauty-hub.com</div>
            </td>
            <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
              <div style={{
                fontSize: '15px', fontWeight: 'bold',
                border: '2.5px solid #000', padding: '4px 14px', display: 'inline-block',
                letterSpacing: '1px',
              }}>
                SURAT PACKING / STRUK
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>Dicetak: {now}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══ INFO PESANAN + ALAMAT ══ */}
      <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            {/* Kiri: info order */}
            <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '16px' }}>
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 'bold', paddingBottom: '4px', width: '120px', color: '#555' }}>No. Pesanan</td>
                    <td style={{ fontWeight: 'bold', fontSize: '13px', paddingBottom: '4px' }}>: {order.order_number}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '3px', color: '#555' }}>Tanggal Order</td>
                    <td style={{ paddingBottom: '3px' }}>: {orderDate}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '3px', color: '#555' }}>Pelanggan</td>
                    <td style={{ paddingBottom: '3px', fontWeight: 'bold' }}>: {profile?.full_name || 'Customer'}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '3px', color: '#555' }}>Status</td>
                    <td style={{ paddingBottom: '3px' }}>
                      : <span style={{ fontWeight: 'bold', border: '1px solid #000', padding: '1px 6px', fontSize: '10px' }}>
                        {statusLabel[order.status] || order.status}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '3px', color: '#555' }}>Pembayaran</td>
                    <td style={{ paddingBottom: '3px' }}>
                      : {payment?.method?.toUpperCase() || '-'}
                      {payment?.bank_name ? ` (${payment.bank_name})` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '3px', color: '#555' }}>Status Bayar</td>
                    <td style={{ paddingBottom: '3px', fontWeight: 'bold' }}>
                      : {payment?.status === 'confirmed' ? '✓ LUNAS'
                        : payment?.status === 'pending'   ? 'BELUM LUNAS'
                        : (payment?.status || '-')}
                    </td>
                  </tr>
                  {shipment && (
                    <>
                      <tr>
                        <td style={{ paddingBottom: '3px', color: '#555' }}>Kurir</td>
                        <td style={{ paddingBottom: '3px', fontWeight: 'bold' }}>: {shipment.courier?.toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td style={{ paddingBottom: '3px', color: '#555' }}>No. Resi</td>
                        <td style={{ paddingBottom: '3px', fontFamily: 'monospace', fontWeight: 'bold' }}>: {shipment.tracking_number}</td>
                      </tr>
                    </>
                  )}
                  {order.notes && (
                    <tr>
                      <td style={{ paddingBottom: '3px', color: '#c00', fontWeight: 'bold' }}>Catatan</td>
                      <td style={{ paddingBottom: '3px', color: '#c00' }}>: {order.notes}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </td>

            {/* Kanan: alamat tujuan */}
            <td style={{ width: '50%', verticalAlign: 'top' }}>
              <div style={{ border: '2px solid #000', padding: '10px', height: '100%', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>
                  📦 Dikirim Kepada:
                </div>
                {address ? (
                  <>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{address.recipient_name}</div>
                    <div style={{ marginTop: '3px' }}>📞 {address.phone}</div>
                    <div style={{ marginTop: '5px', lineHeight: '1.6', fontSize: '11px' }}>{address.full_address}</div>
                    <div style={{ fontSize: '11px' }}>
                      {[address.district, address.city, address.province].filter(Boolean).join(', ')}
                    </div>
                    {address.postal_code && <div style={{ fontSize: '11px' }}>Kode Pos: {address.postal_code}</div>}
                  </>
                ) : (
                  <div style={{ color: '#888', fontStyle: 'italic' }}>Alamat tidak tersedia</div>
                )}
                <div style={{ marginTop: '8px', fontSize: '10px', borderTop: '1px dashed #ccc', paddingTop: '5px', color: '#555' }}>
                  Pengirim: SR12 BEAUTY HUB
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══ DAFTAR PRODUK ══ */}
      <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '5px', borderBottom: '1.5px solid #000', paddingBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Daftar Produk yang Dikemas
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '11px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center', width: '32px' }}>No</th>
            <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'left' }}>Nama Produk</th>
            <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center', width: '80px' }}>Varian</th>
            <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center', width: '45px' }}>Qty</th>
            <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', width: '95px' }}>Harga Satuan</th>
            <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', width: '95px' }}>Subtotal</th>
            <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center', width: '55px' }}>✓ Cek</th>
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
              <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center', fontSize: '18px' }}>□</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ══ RINGKASAN HARGA + INSTRUKSI ══ */}
      <table style={{ width: '100%', marginBottom: '20px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            {/* Instruksi packing */}
            <td style={{ width: '55%', verticalAlign: 'top', paddingRight: '14px' }}>
              <div style={{ border: '1px dashed #aaa', padding: '10px', fontSize: '10px', lineHeight: '1.8' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '11px' }}>📋 Instruksi Packing:</div>
                <div>□ Pastikan semua produk sesuai daftar</div>
                <div>□ Periksa kondisi produk (tidak bocor/rusak)</div>
                <div>□ Kemas dengan bubble wrap / kardus</div>
                <div>□ Tempel label pengiriman dengan benar</div>
                <div>□ Foto paket sebelum diserahkan ke kurir</div>
              </div>
            </td>

            {/* Ringkasan harga */}
            <td style={{ width: '45%', verticalAlign: 'top' }}>
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 8px', color: '#555' }}>Subtotal Produk</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatPrice(Number(order.subtotal))}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', color: '#555' }}>Ongkos Kirim</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                      {Number(order.shipping_cost) === 0 ? 'GRATIS' : formatPrice(Number(order.shipping_cost))}
                    </td>
                  </tr>
                  {order.discount_amount > 0 && (
                    <tr>
                      <td style={{ padding: '4px 8px', color: '#006600' }}>Diskon</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', color: '#006600' }}>
                        -{formatPrice(Number(order.discount_amount))}
                      </td>
                    </tr>
                  )}
                  <tr style={{ backgroundColor: '#111', color: '#fff' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 'bold', fontSize: '13px' }}>TOTAL</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                      {formatPrice(Number(order.total))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══ TANDA TANGAN ══ */}
      <table style={{ width: '100%', borderTop: '1px solid #ccc', paddingTop: '12px', marginTop: '4px', fontSize: '10px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            {['Dikemas oleh,', 'Diperiksa oleh,', 'Diserahkan ke Kurir,'].map((label) => (
              <td key={label} style={{ textAlign: 'center', width: '33%', padding: '0 8px' }}>
                <div>{label}</div>
                <div style={{ height: '45px', borderBottom: '1px solid #000', margin: '8px 16px' }} />
                <div>Nama &amp; Tanda Tangan</div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '9px', color: '#888', borderTop: '1px dashed #ddd', paddingTop: '6px' }}>
        SR12 Beauty Hub &mdash; Dokumen dicetak otomatis dari sistem &bull; Pelanggan: {profile?.full_name || 'Customer'} &bull; {order.order_number}
      </div>
    </div>
  );
});

ReceiptContent.displayName = 'ReceiptContent';

/* ─── Modal Preview Struk ────────────────────────────────────────── */
interface OrderReceiptModalProps {
  order: any;
  onClose: () => void;
}

const OrderReceiptModal = ({ order, onClose }: OrderReceiptModalProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const handlePrint = () => {
    const el = document.getElementById('receipt-printable');
    if (!el) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Struk Pesanan - ${order.order_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000; background: #fff; }
            @media print {
              body { margin: 0; }
              @page { size: A4; margin: 15mm; }
            }
          </style>
        </head>
        <body>
          ${el.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl my-6 rounded-2xl border border-border bg-white shadow-2xl overflow-hidden">

        {/* ── Toolbar ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-white px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 leading-tight">Struk Pesanan</p>
              <p className="text-xs text-gray-500 font-mono">{order.order_number}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Info badges */}
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                <Package className="h-3 w-3" />
                {(order.order_items || []).length} produk
              </span>
              {order.addresses && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  <MapPin className="h-3 w-3" />
                  {order.addresses.city}
                </span>
              )}
              {order.shipments?.[0] && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                  <Truck className="h-3 w-3" />
                  {order.shipments[0].courier}
                </span>
              )}
              {order.payments?.[0] && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  order.payments[0].status === 'confirmed'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-yellow-50 text-yellow-700'
                }`}>
                  <CreditCard className="h-3 w-3" />
                  {order.payments[0].status === 'confirmed' ? 'Lunas' : 'Belum Lunas'}
                </span>
              )}
            </div>

            <Button
              onClick={handlePrint}
              size="sm"
              className="gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              <Printer className="h-4 w-4" />
              Cetak Struk
            </Button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Preview Area ── */}
        <div className="bg-gray-100 p-4 sm:p-6">
          <div className="rounded-xl shadow-lg overflow-hidden">
            <ReceiptContent ref={printRef} order={order} />
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="flex items-center justify-between border-t border-border bg-gray-50 px-5 py-3">
          <p className="text-xs text-gray-500">
            Preview struk akan tercetak persis seperti tampilan di atas
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-full">
              Tutup
            </Button>
            <Button size="sm" onClick={handlePrint} className="gap-1.5 rounded-full">
              <Printer className="h-3.5 w-3.5" />
              Cetak
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Export utama (wrapper forwardRef untuk kompatibilitas AdminOrders) ── */
const OrderReceipt = forwardRef<HTMLDivElement, OrderReceiptProps>(({ order, onClose }, _ref) => {
  if (!order) return null;
  return <OrderReceiptModal order={order} onClose={onClose || (() => {})} />;
});

OrderReceipt.displayName = 'OrderReceipt';
export default OrderReceipt;
