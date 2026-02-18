import React from "react";

interface PaymentLayoutProps {
  children: React.ReactNode;
}

export const PaymentLayout: React.FC<PaymentLayoutProps> = ({ children }) => {
  return <div className="flex flex-col">{children}</div>;
};
