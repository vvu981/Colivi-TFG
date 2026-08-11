import React from "react";

export const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen">
    <main className="flex-1">{children}</main>
  </div>
);