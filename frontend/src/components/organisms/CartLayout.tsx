import React from "react";

interface CartLayoutProps {
  children: React.ReactNode;
}

export const CartLayout: React.FC<CartLayoutProps> = ({ children }) => {
  return <div className="flex flex-col">{children}</div>;
};
