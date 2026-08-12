"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, Trash2, Loader2, AlertCircle, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "student-photos";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Sube la foto de perfil de un alumno a un bucket PÚBLICO de Storage
 * (`student-photos`) y emite la URL pública resultante — es solo una
 * foto de reconocimiento (no un documento sensible como la CURP), por
 * eso puede vivir en un bucket público como class-covers.
 */
export function StudentPhotoUploader({
  fileNamePrefix = "alumno",
  onChange,
}: {
  fileNamePrefix?: string;
  /** Se llama con la URL pública subida (o null si se quita). */
  onChange: (url: string | null) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError("Formato no soportado. Usa JPG, PNG, WebP o AVIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("La foto debe pesar menos de 5MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const safePrefix = fileNamePrefix
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
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
      setUrl(data.publicUrl);
      onChange(data.publicUrl);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setError(null);
    setUrl(null);
    onChange(null);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 rounded-full overflow-hidden border border-bone-border/40 bg-ink-surface shrink-0">
        {url ? (
          <Image
            src={url}
            alt="Foto de perfil"
            fill
            sizes="64px"
            className="object-cover"
            unoptimized={!url.includes("supabase.co")}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-bone-mute/60">
            <User className="w-6 h-6" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
            <Loader2 className="w-4 h-4 animate-spin text-bone" />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
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
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium bg-bone text-ink hover:bg-lumen disabled:opacity-50 transition-colors"
          >
            <Upload className="w-3 h-3" />
            {url ? "Cambiar foto" : "Subir foto"}
          </button>
          {url && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs border border-bone-border/40 text-bone-mute hover:text-danger hover:border-danger/40 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className="text-[10px] font-mono uppercase tracking-wider text-bone-mute">
          Opcional · para que el profesor la reconozca
        </p>
        {error && (
          <p className="flex items-start gap-1.5 text-xs text-danger">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
