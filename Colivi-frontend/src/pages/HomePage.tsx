import React from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";

export const HomePage = () => {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 text-slate-100 p-6">
        <h1 className="text-5xl font-bold mb-6">Bienvenido a Colivi</h1>
        <p className="text-xl mb-10 max-w-2xl text-center text-slate-400">
          La nueva forma de vivir y compartir espacios. 
        </p>
        <div className="flex gap-4">
          <Link 
            to="/login" 
            className="px-6 py-3 bg-primary hover:bg-surface-tint text-white font-semibold rounded-lg transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link 
            to="/register" 
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
          >
            Regístrate
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};