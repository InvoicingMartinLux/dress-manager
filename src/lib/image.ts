/**
 * Downscale a photo in the browser before uploading.
 *
 * Phone cameras produce 3–12 MB images, but a Vercel serverless function only
 * accepts a 4.5 MB request body — so a raw phone photo can fail to upload.
 * Resizing to a long edge of 1600px keeps plenty of detail for both the AI
 * analysis and the wardrobe thumbnails.
 */
export async function downscaleImage(
  file: File,
  maxEdge = 1600,
  quality = 0.85
): Promise<File> {
  // Animated GIFs would lose their animation; leave them alone.
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  try {
    // `from-image` applies the EXIF orientation, so portrait photos taken on a
    // phone don't come out sideways.
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, maxEdge / longest);

    if (scale === 1 && file.size <= 2_000_000) {
      bitmap.close();
      return file;
    }

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    // Any failure here is non-fatal — fall back to the original file.
    return file;
  }
}
