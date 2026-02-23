export {};

type MidtransPayResult = {
  transaction_id?: string;
  order_id?: string;
  transaction_status?: string;
  payment_type?: string;
  status_code?: string;
  status_message?: string;
};

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        callbacks?: {
          onSuccess?: (result: MidtransPayResult) => void;
          onPending?: (result: MidtransPayResult) => void;
          onError?: (result: MidtransPayResult) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}
