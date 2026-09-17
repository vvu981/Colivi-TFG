import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant font-label-sm text-label-sm w-full pt-6 pb-24 md:pb-6 px-4 sm:px-6 md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="mb-4 md:mb-0">
        <span className="font-headline-sm text-headline-sm font-bold text-on-surface block mb-1">Colivi</span>
        <span className="text-on-surface-variant">© {new Date().getFullYear()} Colivi. All rights reserved.</span>
      </div>
      <div className="flex flex-wrap justify-center md:justify-end gap-4">
        <Link to="/terms" className="text-on-surface-variant hover:text-primary underline transition-all focus:ring-2 focus:ring-primary">Terms of Service</Link>
        <Link to="/privacy" className="text-on-surface-variant hover:text-primary underline transition-all focus:ring-2 focus:ring-primary">Privacy Policy</Link>
        <Link to="/cookies" className="text-on-surface-variant hover:text-primary underline transition-all focus:ring-2 focus:ring-primary">Cookie Settings</Link>
        <Link to="/contact" className="text-on-surface-variant hover:text-primary underline transition-all focus:ring-2 focus:ring-primary">Contact Us</Link>
      </div>
    </footer>
  );
};