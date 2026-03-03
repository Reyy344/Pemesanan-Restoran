import React from "react";

interface HistoryLayoutProps {
  children: React.ReactNode;
}

export const HistoryLayout: React.FC<HistoryLayoutProps> = ({ children }) => {
  return <div className="flex flex-col">{children}</div>;
};
