"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { toggleAlbumPublishedAction, deleteAlbumAction } from "./actions";
import { cn } from "@/lib/utils";

export function PublishToggle({
  albumId,
  initialPublished,
}: {
  albumId: string;
  initialPublished: boolean;
}) {
  const [published, setPublished] = useState(initialPublished);
  const [pending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !published;
    setPublished(next);
    startTransition(async () => {
      const res = await toggleAlbumPublishedAction(albumId, next);
      if (res?.error) setPublished(!next);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded transition-colors",
        published
          ? "bg-success/10 text-success hover:bg-success/20"
          : "bg-warning/10 text-warning hover:bg-warning/20",
        pending && "opacity-50 cursor-wait",
      )}
    >
      {published ? (
        <>
          <Eye className="w-2.5 h-2.5" />
          Publicado
        </>
      ) : (
        <>
          <EyeOff className="w-2.5 h-2.5" />
          Oculto
        </>
      )}
    </button>
  );
}

export function DeleteAlbumButton({ albumId }: { albumId: string }) {
  const [pending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        "¿Eliminar este álbum permanentemente? El link a Drive sigue existiendo.",
      )
    )
      return;
    startTransition(async () => {
      await deleteAlbumAction(albumId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1 text-bone-mute hover:text-danger text-xs disabled:opacity-50 transition-colors"
      aria-label="Eliminar álbum"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
