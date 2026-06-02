"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Upload, Trash2, Loader2, AlertCircle, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const BUCKET = "class-covers";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Sube una imagen a Supabase Storage y emite la URL pública resultante.
 * - Modo "controlled": pasas `value` y `onChange`. Útil dentro de un form
 *   donde tú manejas la URL.
 * - Modo "auto-save": pasas `onSave` (server action) que recibe la URL
 *   nueva y la persiste de inmediato. Útil para edición instantánea.
 *
 * Renderiza:
 * - Preview de la imagen actual
 * - Botones "Subir nueva" / "Quitar"
 * - Input hidden con la URL para que el form la mande al server (modo
 *   controlled).
 */
export function CoverUploader({
  name = "cover_url",
  value,
  onChange,
  onSave,
  fileNamePrefix = "class",
}: {
  /** Nombre del input hidden con la URL (para que el form lo envíe) */
  name?: string;
  /** URL inicial / actual */
  value?: string | null;
  /** Callback cuando la URL cambia (modo controlled) */
  onChange?: (url: string | null) => void;
  /** Callback que persiste la URL inmediatamente (modo auto-save) */
  onSave?: (url: string | null) => Promise<{ error?: string } | void>;
  /** Prefijo para el filename en Storage (slug del style, ej.) */
  fileNamePrefix?: string;
}) {
  const [url, setUrl] = useState<string | null>(value ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingPending, startSavingTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const update = async (newUrl: string | null) => {
    setUrl(newUrl);
    onChange?.(newUrl);
    if (onSave) {
      startSavingTransition(async () => {
        const res = await onSave(newUrl);
        if (res && "error" in res && res.error) {
          setError(res.error);
        }
      });
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError("Formato no soportado. Usa JPG, PNG, WebP o AVIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("La imagen debe pesar menos de 5MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const safePrefix = fileNamePrefix
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .slice(0, 40);
      const path = `${safePrefix}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });
      if (upErr) {
        setError(`No se pudo subir: ${upErr.message}`);
        return;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      await update(data.publicUrl);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setError(null);
    await update(null);
  };

  const busy = uploading || savingPending;

  return (
    <div className="space-y-3">
      {/* Preview */}
      <div
        className={cn(
          "relative w-full aspect-[4/3] rounded-2xl border border-bone-border/40 bg-ink-surface overflow-hidden",
          busy && "opacity-60",
        )}
      >
        {url ? (
          <Image
            src={url}
            alt="Portada"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
            unoptimized={!url.includes("supabase.co")}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-bone-mute/60">
            <ImageIcon className="w-10 h-10 mb-2" />
            <p className="text-xs font-mono uppercase tracking-widest">
              Sin portada
            </p>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
            <Loader2 className="w-6 h-6 animate-spin text-bone" />
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED.join(",")}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium bg-bone text-ink hover:bg-lumen disabled:opacity-50 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          {url ? "Cambiar imagen" : "Subir imagen"}
        </button>
        {url && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs border border-bone-border/40 text-bone-mute hover:text-danger hover:border-danger/40 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Quitar
          </button>
        )}
        <p className="ml-auto text-[10px] font-mono uppercase tracking-wider text-bone-mute">
          Máx 5 MB · JPG, PNG, WebP, AVIF
        </p>
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-xs text-danger">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {/* Hidden input para que el form mande la URL */}
      <input type="hidden" name={name} value={url ?? ""} />
    </div>
  );
}
