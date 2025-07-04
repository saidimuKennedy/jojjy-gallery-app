import React, { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return <div className="min-h-screen bg-white">{children}</div>;
};

export default Layout;
