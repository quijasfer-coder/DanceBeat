"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, Loader2, AlertCircle, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "student-documents";
const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED = ["application/pdf"];

/**
 * Sube el PDF de la CURP a un bucket PRIVADO de Supabase Storage
 * (`student-documents`) y emite el path resultante (no una URL pública —
 * el bucket no es público, hay que generar signed URL para verlo).
 * Path: curp/<accountId>/<prefijo>-<timestamp>.pdf — las policies de
 * Storage usan ese segundo segmento para validar que cada cuenta solo
 * suba dentro de su propia carpeta.
 */
export function CurpUploader({
  accountId,
  fileNamePrefix = "curp",
  onChange,
}: {
  accountId: string;
  fileNamePrefix?: string;
  /** Se llama con el path subido (o null si se quita) para que el form padre lo guarde. */
  onChange: (path: string | null) => void;
}) {
  const [path, setPath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError("Solo se aceptan archivos en PDF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("El archivo debe pesar menos de 8MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const safePrefix = fileNamePrefix
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .slice(0, 40);
      const objectPath = `curp/${accountId}/${safePrefix}-${Date.now()}.pdf`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(objectPath, file, {
          contentType: "application/pdf",
          cacheControl: "3600",
          upsert: false,
        });
      if (upErr) {
        setError(`No se pudo subir: ${upErr.message}`);
        return;
      }

      setPath(objectPath);
      setFileName(file.name);
      onChange(objectPath);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setError(null);
    setPath(null);
    setFileName(null);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
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
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium bg-bone text-ink hover:bg-lumen disabled:opacity-50 transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {path ? "Cambiar PDF" : "Subir PDF de la CURP"}
        </button>
        {path && (
          <>
            <span className="inline-flex items-center gap-1.5 text-xs text-bone-mute">
              <FileText className="w-3.5 h-3.5" />
              {fileName}
            </span>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs border border-bone-border/40 text-bone-mute hover:text-danger hover:border-danger/40 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Quitar
            </button>
          </>
        )}
      </div>
      <p className="text-[10px] font-mono uppercase tracking-wider text-bone-mute">
        Máx 8 MB · Solo PDF
      </p>
      {error && (
        <p className="flex items-start gap-1.5 text-xs text-danger">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
