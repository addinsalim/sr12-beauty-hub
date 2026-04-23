// Type declaration untuk Midtrans Snap
interface SnapOptions {
  onSuccess?: (result: SnapResult) => void;
  onPending?: (result: SnapResult) => void;
  onError?: (result: SnapResult) => void;
  onClose?: () => void;
}

interface SnapResult {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  status_code?: string;
  status_message?: string;
}

interface Snap {
  pay: (snapToken: string, options?: SnapOptions) => void;
  hide: () => void;
}

declare global {
  interface Window {
    snap: Snap;
  }
}

export {};
