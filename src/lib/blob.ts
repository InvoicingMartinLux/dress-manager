/**
 * Thumbnail companion for a stored image. The thumbnail is written next to
 * the original with a "-thumb" suffix, so its location can be derived from
 * the original's URL or pathname without storing a second column.
 *
 *   garments/<user>/<uuid>.jpg  ->  garments/<user>/<uuid>-thumb.jpg
 */
export function thumbVariant(urlOrPathname: string): string {
  return urlOrPathname.replace(/(\.[a-z0-9]+)(\?.*)?$/i, "-thumb$1$2");
}

/** Path of the image route for a garment, optionally the thumbnail. */
export function imageRoute(garmentId: string, variant?: "thumb"): string {
  return variant
    ? `/api/garments/${garmentId}/image?variant=thumb`
    : `/api/garments/${garmentId}/image`;
}

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
