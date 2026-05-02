import { forwardRef } from 'react';
import { formatPrice } from '@/lib/supabaseHelpers';

interface OrderReceiptProps {
  order: any;
}

// This component is designed to be printed — uses print-safe styling
const OrderReceipt = forwardRef<HTMLDivElement, OrderReceiptProps>(({ order }, ref) => {
  if (!order) return null;

  const address = order.addresses;
  const payment = order.payments?.[0];
  const shipment = order.shipments?.[0];
  const profile = order.profile;
  const items = order.order_items || [];

  const statusLabel: Record<string, string> = {
    pending_payment: 'Menunggu Pembayaran',
    processing: 'Diproses',
    shipped: 'Dikirim',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  };

  return (
    <div
      ref={ref}
      className="print-receipt"
      style={{ display: 'none', width: '80mm', padding: '4mm', fontFamily: 'monospace', fontSize: '11px', backgroundColor: 'white', color: 'black' }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '4mm' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px' }}>SR12 BEAUTY HUB</div>
        <div style={{ fontSize: '9px', marginTop: '1mm' }}>Toko Kecantikan Terpercaya</div>
        <div style={{ fontSize: '9px' }}>www.sr12-beauty-hub.com</div>
        <div style={{ borderTop: '1px dashed #000', margin: '3mm 0' }} />
      </div>

      {/* Order Info */}
      <div style={{ marginBottom: '3mm' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>No. Pesanan</span>
          <span style={{ fontWeight: 'bold' }}>{order.order_number}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tanggal</span>
          <span>{new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Status</span>
          <span>{statusLabel[order.status] || order.status}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Pelanggan</span>
          <span>{profile?.full_name || 'Customer'}</span>
        </div>
        {profile?.phone && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Telepon</span>
            <span>{profile.phone}</span>
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '3mm 0' }} />

      {/* Alamat */}
      {address && (
        <div style={{ marginBottom: '3mm' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '1mm' }}>ALAMAT PENGIRIMAN</div>
          <div>{address.recipient_name}</div>
          <div>{address.phone}</div>
          <div>{address.full_address}</div>
          <div>{[address.district, address.city, address.province, address.postal_code].filter(Boolean).join(', ')}</div>
        </div>
      )}

      <div style={{ borderTop: '1px dashed #000', margin: '3mm 0' }} />

      {/* Items */}
      <div style={{ marginBottom: '3mm' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '1mm' }}>PRODUK</div>
        {items.map((item: any) => (
          <div key={item.id} style={{ marginBottom: '2mm' }}>
            <div style={{ wordBreak: 'break-word' }}>
              {item.products?.name}
              {item.variants?.name ? ` (${item.variants.name})` : ''}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.quantity} x {formatPrice(Number(item.price))}</span>
              <span>{formatPrice(Number(item.total))}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '3mm 0' }} />

      {/* Totals */}
      <div style={{ marginBottom: '3mm' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal</span>
          <span>{formatPrice(Number(order.subtotal))}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Ongkos Kirim</span>
          <span>{Number(order.shipping_cost) === 0 ? 'GRATIS' : formatPrice(Number(order.shipping_cost))}</span>
        </div>
        {order.discount_amount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Diskon</span>
            <span>-{formatPrice(Number(order.discount_amount))}</span>
          </div>
        )}
        <div style={{ borderTop: '1px solid #000', margin: '2mm 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}>
          <span>TOTAL</span>
          <span>{formatPrice(Number(order.total))}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '3mm 0' }} />

      {/* Payment */}
      {payment && (
        <div style={{ marginBottom: '3mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Pembayaran</span>
            <span>{payment.method?.toUpperCase()}{payment.bank_name ? ` - ${payment.bank_name}` : ''}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Status Bayar</span>
            <span>{payment.status}</span>
          </div>
        </div>
      )}

      {/* Shipment */}
      {shipment && (
        <div style={{ marginBottom: '3mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Kurir</span>
            <span>{shipment.courier?.toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>No. Resi</span>
            <span>{shipment.tracking_number}</span>
          </div>
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <>
          <div style={{ borderTop: '1px dashed #000', margin: '3mm 0' }} />
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '1mm' }}>CATATAN</div>
            <div>{order.notes}</div>
          </div>
        </>
      )}

      <div style={{ borderTop: '1px dashed #000', margin: '3mm 0' }} />

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '9px' }}>
        <div>Terima kasih telah berbelanja!</div>
        <div>Dicetak: {new Date().toLocaleString('id-ID')}</div>
        <div style={{ marginTop: '2mm' }}>★ SR12 Beauty Hub ★</div>
      </div>
    </div>
  );
});

OrderReceipt.displayName = 'OrderReceipt';
export default OrderReceipt;
