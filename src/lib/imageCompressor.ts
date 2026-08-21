/**
 * Utility for client-side image compression using HTML5 Canvas.
 * Used by Citizen SOS reporting to reduce photo file sizes before upload
 * without adding external NPM dependencies.
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 to 1.0
}

/**
 * Compresses an image file to a JPEG Data URL string (Base64).
 * Returns null safely if compression fails or if input is invalid,
 * ensuring media failure never blocks emergency SOS reporting.
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<string | null> {
  const { maxWidth = 1024, maxHeight = 1024, quality = 0.7 } = options;

  if (!file || !file.type.startsWith('image/')) {
    console.warn('[ImageCompressor] Invalid file provided for compression:', file);
    return null;
  }

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();

      reader.onerror = (err) => {
        console.error('[ImageCompressor] FileReader error:', err);
        resolve(null);
      };

      reader.onload = (event) => {
        const img = new Image();

        img.onerror = (err) => {
          console.error('[ImageCompressor] Image loading error:', err);
          resolve(null);
        };

        img.onload = () => {
          try {
            let width = img.width;
            let height = img.height;

            // Calculate scaled dimensions while preserving aspect ratio
            if (width > maxWidth || height > maxHeight) {
              if (width / height > maxWidth / maxHeight) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              console.warn('[ImageCompressor] Canvas 2D context not available');
              resolve(null);
              return;
            }

            // Draw image on canvas
            ctx.drawImage(img, 0, 0, width, height);

            // Export compressed JPEG base64 data URL
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
          } catch (canvasErr) {
            console.error('[ImageCompressor] Canvas processing error:', canvasErr);
            resolve(null);
          }
        };

        img.src = event.target?.result as string;
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('[ImageCompressor] Unexpected compression error:', err);
      resolve(null);
    }
  });
}
