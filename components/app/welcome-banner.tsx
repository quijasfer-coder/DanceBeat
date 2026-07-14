"use client";

import { useState, useEffect } from "react";
import { X, Users, Bell, CalendarCheck, Image as ImageIcon } from "lucide-react";

const STORAGE_KEY = "db_welcome_dismissed";

export function WelcomeBanner({ name }: { name: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="relative rounded-2xl border border-lumen/20 bg-lumen/5 p-8 mb-12 overflow-hidden">
      {/* Glow sutil */}
      <div
        aria-hidden
        className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-lumen/10 blur-3xl pointer-events-none"
      />

      <button
        onClick={dismiss}
        aria-label="Cerrar"
        className="absolute top-4 right-4 text-bone-mute hover:text-bone transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <p className="font-mono text-[10px] uppercase tracking-widest text-lumen mb-3">
        Bienvenida a Dance Beat
      </p>

      <h2 className="font-display text-3xl md:text-4xl leading-[0.95] text-bone mb-4">
        Hola, {name.split(" ")[0]}.<br />
        <span className="italic text-lumen">Aquí empieza todo.</span>
      </h2>

      <p className="text-sm text-bone-mute max-w-xl leading-relaxed mb-8">
        Esta es tu cuenta personal en Dance Beat Academy. Desde aquí puedes
        gestionar todos los alumnos registrados bajo tu plan familiar — ya sean
        tus hijos, tú misma o cualquier persona a tu cargo.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-7 h-7 rounded-lg bg-lumen/15 flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5 text-lumen" />
          </div>
          <div>
            <p className="text-sm font-medium text-bone">Tus alumnos</p>
            <p className="text-xs text-bone-mute mt-0.5 leading-relaxed">
              Ve cuántos alumnos tienes registrados y el estado de su plan en un solo lugar.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-7 h-7 rounded-lg bg-lumen/15 flex items-center justify-center shrink-0">
            <Bell className="w-3.5 h-3.5 text-lumen" />
          </div>
          <div>
            <p className="text-sm font-medium text-bone">Eventos y avisos</p>
            <p className="text-xs text-bone-mute mt-0.5 leading-relaxed">
              Aquí te avisamos de competencias, ensayos y presentaciones asignadas a tus alumnos.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-7 h-7 rounded-lg bg-lumen/15 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-3.5 h-3.5 text-lumen" />
          </div>
          <div>
            <p className="text-sm font-medium text-bone">Próximas reservas</p>
            <p className="text-xs text-bone-mute mt-0.5 leading-relaxed">
              Consulta las clases reservadas para cada alumno y gestiona su agenda fácilmente.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-7 h-7 rounded-lg bg-lumen/15 flex items-center justify-center shrink-0">
            <ImageIcon className="w-3.5 h-3.5 text-lumen" />
          </div>
          <div>
            <p className="text-sm font-medium text-bone">Contenido exclusivo</p>
            <p className="text-xs text-bone-mute mt-0.5 leading-relaxed">
              Accede a fotos y recuerdos de todos los festivales y presentaciones de Dance Beat, solo para familias.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={dismiss}
        className="mt-8 text-xs font-mono uppercase tracking-widest text-bone-mute hover:text-bone transition-colors"
      >
        Entendido, no mostrar de nuevo →
      </button>
    </div>
  );
}
