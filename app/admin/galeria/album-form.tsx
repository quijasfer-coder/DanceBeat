"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Save, AlertCircle } from "lucide-react";
import {
  createAlbumAction,
  updateAlbumAction,
  type AlbumFormState,
} from "./actions";

const labelClass =
  "block text-xs font-mono uppercase tracking-widest text-bone-mute mb-2";
const inputClass =
  "w-full bg-ink-off border border-bone-border/40 rounded-lg px-4 py-3 text-bone placeholder:text-bone-mute/50 focus:outline-none focus:border-lumen transition-colors";
const textareaClass = `${inputClass} resize-y min-h-[100px]`;

export type AlbumDefaults = {
  title?: string;
  description?: string | null;
  event_date?: string | null;
  cover_url?: string | null;
  drive_url?: string;
  is_published?: boolean;
  display_order?: number;
};

export function AlbumForm({
  albumId,
  defaults = {},
}: {
  albumId?: string;
  defaults?: AlbumDefaults;
}) {
  const action = albumId
    ? updateAlbumAction.bind(null, albumId)
    : createAlbumAction;
  const [state, formAction, pending] = useActionState<
    AlbumFormState,
    FormData
  >(action, null);

  const isEdit = !!albumId;

  return (
    <form action={formAction} className="space-y-6 max-w-3xl">
      {state?.error && (
        <div className="flex items-start gap-3 border border-danger/40 bg-danger/10 rounded-lg p-4 text-sm text-bone">
          <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <p>{state.error}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className={labelClass}>
          Título <span className="text-danger">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={defaults.title ?? ""}
          className={inputClass}
          placeholder="Ej. Luminaria 2025 — Acto 1"
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={defaults.description ?? ""}
          className={textareaClass}
          placeholder="Una breve nota para el álbum (opcional)."
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="event_date" className={labelClass}>
            Fecha del evento
          </label>
          <input
            id="event_date"
            name="event_date"
            type="date"
            defaultValue={defaults.event_date ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="display_order" className={labelClass}>
            Orden de aparición
          </label>
          <input
            id="display_order"
            name="display_order"
            type="number"
            min={0}
            defaultValue={defaults.display_order ?? 0}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-bone-mute">
            Menor número aparece primero.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="cover_url" className={labelClass}>
          URL de portada
        </label>
        <input
          id="cover_url"
          name="cover_url"
          type="url"
          defaultValue={defaults.cover_url ?? ""}
          className={inputClass}
          placeholder="https://..."
        />
        <p className="mt-1 text-xs text-bone-mute">
          Puedes pegar el link normal de "Compartir" de un archivo de Drive
          (se convierte automáticamente), o una imagen directa de
          Cloudinary/otro host. Si lo dejas vacío, se muestra una card sin
          imagen.
        </p>
      </div>

      <div>
        <label htmlFor="drive_url" className={labelClass}>
          Link a Google Drive <span className="text-danger">*</span>
        </label>
        <input
          id="drive_url"
          name="drive_url"
          type="url"
          required
          defaultValue={defaults.drive_url ?? ""}
          className={inputClass}
          placeholder="https://drive.google.com/drive/folders/..."
        />
        <p className="mt-1 text-xs text-bone-mute">
          La carpeta o álbum debe estar compartido con permiso de "Cualquier
          persona con el enlace".
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="is_published"
          name="is_published"
          type="checkbox"
          defaultChecked={defaults.is_published ?? false}
          className="w-4 h-4 rounded border-bone-border/40 bg-ink-off text-lumen focus:ring-lumen"
        />
        <label htmlFor="is_published" className="text-sm text-bone">
          Publicado (visible para alumnas)
        </label>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 bg-bone text-ink px-6 py-3 rounded-full text-sm font-medium hover:bg-lumen disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {pending
            ? "Guardando…"
            : isEdit
              ? "Guardar cambios"
              : "Crear álbum"}
        </button>
        <Link
          href="/admin/galeria"
          className="inline-flex items-center gap-2 border border-bone-border/60 hover:border-bone px-5 py-2.5 rounded-full text-sm text-bone hover:bg-bone/5 transition-all"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
