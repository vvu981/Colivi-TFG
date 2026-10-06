import React from "react";

export const Button = ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={className} {...props}>{children}</button>
);