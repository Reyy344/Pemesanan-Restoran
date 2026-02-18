import React from "react";

interface TableLayoutProps {
  children: React.ReactNode;
}

export const TableLayout: React.FC<TableLayoutProps> = ({ children }) => {
  return <div className="flex flex-col">{children}</div>;
};
