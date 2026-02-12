interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Cloudflare Image Resizing loader para next/image.
 * Transforma las URLs de imágenes para usar el servicio de
 * optimización de Cloudflare (resize, format auto, quality).
 *
 * Docs: https://developers.cloudflare.com/images/transform-images/
 */
export default function cloudflareImageLoader({
  src,
  width,
  quality,
}: ImageLoaderParams): string {
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;

  // En desarrollo, devolver la imagen sin transformar
  if (!cdnUrl || process.env.NODE_ENV === "development") {
    return src;
  }

  const params = [
    `width=${width}`,
    `quality=${quality || 75}`,
    "format=auto",
    "fit=cover",
  ].join(",");

  // Si la imagen ya es una URL completa
  if (src.startsWith("http")) {
    return `${cdnUrl}/cdn-cgi/image/${params}/${src}`;
  }

  // Si es una ruta relativa
  return `${cdnUrl}/cdn-cgi/image/${params}${src}`;
}
