/**
 * Center-crops an image file to a square and shrinks it to `size` px, returning
 * a JPEG data URL — keeps uploads tiny (usually 15–40 KB) no matter what the
 * phone camera produced.
 */
/** `format: "png"` keeps transparency (for trophy art); JPEG is smaller for photos. */
export async function resizeImageToDataUrl(file: File, size = 256, quality = 0.85, format: "jpeg" | "png" = "jpeg"): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Couldn't read that image"));
      el.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    if (!side) throw new Error("Couldn't read that image");
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser can't process images");
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    );
    return format === "png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
