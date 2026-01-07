import { toPng } from "html-to-image";

// ============================================
// Share Utility
// Generates and shares receipt images
// ============================================

export interface ShareReceiptOptions {
  element: HTMLElement;
  filename?: string;
}

/**
 * Converts an HTML element to a PNG and triggers native share or download
 */
export async function shareReceipt({
  element,
  filename = "fulean2-receipt",
}: ShareReceiptOptions): Promise<boolean> {
  try {
    // Generate PNG blob from element
    const dataUrl = await toPng(element, {
      quality: 0.95,
      pixelRatio: 2, // High DPI for crisp images
      backgroundColor: "#0a0a0a",
    });

    // Convert data URL to Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `${filename}.png`, { type: "image/png" });

    // Try native share API first
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        title: "Fulean2 - Comprobante",
        text: "Comprobante de operación",
        files: [file],
      });
      return true;
    }

    // Fallback: Download the image
    downloadImage(dataUrl, `${filename}.png`);
    return true;
  } catch (error) {
    console.error("Error sharing receipt:", error);
    return false;
  }
}

/**
 * Downloads an image from a data URL
 */
function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Formats a date for display on receipts
 */
export function formatReceiptDate(date: Date): string {
  return date.toLocaleDateString("es-CU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatReceiptTime(date: Date): string {
  return date.toLocaleTimeString("es-CU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
