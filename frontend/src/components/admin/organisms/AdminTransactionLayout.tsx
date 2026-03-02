import React from "react";

interface AdminTransactionLayoutProps {
  children: React.ReactNode;
}

export const AdminTransactionLayout: React.FC<AdminTransactionLayoutProps> = ({
  children,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col">
      {children}
    </div>
  );
};
