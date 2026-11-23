import { encode } from "uqr";

/** A QR code as a PNG file, large enough to print or scan from a screen. */
export async function renderQrCodePng(value: string, moduleSize = 8): Promise<Blob> {
  // A 4-module quiet zone is required by the QR specification for scanners.
  const { data, size } = encode(value, { ecc: "M", border: 4 });
  const canvas = document.createElement("canvas");
  canvas.width = size * moduleSize;
  canvas.height = size * moduleSize;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas not available");
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#1A1033";
  data.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) context.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
    }),
  );
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG failed"))), "image/png"),
  );
}

/** The browser's own QR reader, where it exists (Chrome on Android, macOS…). */
interface BarcodeDetectorLike {
  detect(image: ImageBitmapSource): Promise<Array<{ rawValue: string }>>;
}
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorLike;

/** Photos are scaled down to this size: plenty for a QR code, and much faster. */
const MAX_SCAN_SIZE = 1600;

/**
 * Reads the QR code on a photo or an image. The browser's reader is used when
 * there is one; otherwise jsQR, loaded only now, reads the pixels. Returns the
 * text of the QR code, or null when none is found.
 */
export async function readQrCodeFromImage(file: Blob): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  try {
    const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor })
      .BarcodeDetector;
    if (Detector) {
      try {
        const [found] = await new Detector({ formats: ["qr_code"] }).detect(bitmap);
        if (found?.rawValue) return found.rawValue;
      } catch {
        // Not able to read QR codes on this device: jsQR takes over.
      }
    }

    const scale = Math.min(1, MAX_SCAN_SIZE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height);
    const { default: jsQR } = await import("jsqr");
    return jsQR(pixels.data, width, height, { inversionAttempts: "attemptBoth" })?.data ?? null;
  } finally {
    bitmap.close();
  }
}
