import React, { useState } from "react";

interface TableBooking {
  orderId: number;
  userId: number;
  customerName: string;
  guestCount: number;
  status: string;
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  qty?: number;
}

export const PaymentTemplate: React.FC = () => {
  return <h1 className="text-white font-bold">Masih Kosong</h1>;
};
