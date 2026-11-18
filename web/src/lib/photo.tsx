"use client";
// Foto de un reporte. Si no carga (borrada, 404), un recuadro gris con la cámara en el mismo lugar y tamaño,
// en vez del ícono de imagen rota y el texto alternativo.
import { useState } from "react";
import { Icon } from "@/lib/icon";

export function Photo({ src, alt, iconSize }: { src: string; alt: string; iconSize?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="photo-missing" role={alt ? "img" : undefined} aria-label={alt || undefined}>
        <Icon name="camera" size={iconSize} />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      // El error puede llegar antes de que React hidrate y onError se lo pierde: complete sin tamaño = rota.
      ref={(img) => {
        if (img?.complete && !img.naturalWidth) setFailed(true);
      }}
    />
  );
}
