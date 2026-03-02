import React from "react";

interface AdminProductsLayoutProps {
  children: React.ReactNode;
}

export const AdminProductsLayout: React.FC<AdminProductsLayoutProps> = ({
  children,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col">
      {children}
    </div>
  );
};
