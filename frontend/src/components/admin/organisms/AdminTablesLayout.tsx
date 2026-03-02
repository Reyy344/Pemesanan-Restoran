import React from "react";

interface AdminTablesLayoutProps {
  children: React.ReactNode;
}

export const AdminTablesLayout: React.FC<AdminTablesLayoutProps> = ({
  children,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col">
      {children}
    </div>
  );
};
