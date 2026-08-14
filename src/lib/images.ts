// Client-side image pipeline: downscale + re-encode uploads before they hit
// IndexedDB. Keeping stored photos small (~200–500 KB) is the single biggest
// lever for staying inside browser storage quotas.

const DISPLAY_MAX_EDGE = 2000;
const THUMB_MAX_EDGE = 400;
const JPEG_QUALITY = 0.82;

export interface ProcessedImage {
  display: Blob;
  thumb: Blob;
  /** Dimensions of the display variant. */
  width: number;
  height: number;
}

async function decode(file: File): Promise<ImageBitmap> {
  try {
    // 'from-image' applies EXIF orientation so phone photos aren't sideways.
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Older Safari rejects the options bag; retry bare before giving up.
    try {
      return await createImageBitmap(file);
    } catch {
      throw new Error(
        `Couldn't read “${file.name}”. If it's an HEIC photo, convert it to JPEG and try again.`,
      );
    }
  }
}

async function encodeJpeg(
  bitmap: ImageBitmap,
  maxEdge: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not available.');
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
    return { blob, width, height };
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  );
  if (!blob) throw new Error('Image encoding failed.');
  return { blob, width, height };
}

export async function processImageFile(file: File): Promise<ProcessedImage> {
  const bitmap = await decode(file);
  try {
    const display = await encodeJpeg(bitmap, DISPLAY_MAX_EDGE);
    const thumb = await encodeJpeg(bitmap, THUMB_MAX_EDGE);
    return { display: display.blob, thumb: thumb.blob, width: display.width, height: display.height };
  } finally {
    bitmap.close();
  }
}

/**
 * Ask the browser to protect this origin's storage from eviction.
 * Called after the first successful photo upload; harmless to repeat.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    // Not supported or denied — storage stays best-effort.
  }
  return false;
}
