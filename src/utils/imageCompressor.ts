export interface CompressedImageResult {
  base64: string;
  sizeKB: number;
  width: number;
  height: number;
}

/**
 * Compresses an image file using HTML5 Canvas to JPEG < 150KB
 * @param file The image File from input/camera
 * @param maxDimension Maximum width/height in pixels (default: 1200)
 * @param targetMaxKB Target maximum file size in KB (default: 150)
 */
export async function compressImage(
  file: File,
  maxDimension = 1200,
  targetMaxKB = 150
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh'));

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Không thể tải dữ liệu ảnh'));

      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio scale
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Không thể khởi tạo Canvas 2D context'));
          return;
        }

        // Draw image onto canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Iteratively find quality that fits under targetMaxKB
        let quality = 0.8;
        let base64 = canvas.toDataURL('image/jpeg', quality);
        let sizeKB = calculateBase64SizeKB(base64);

        while (sizeKB > targetMaxKB && quality > 0.2) {
          quality -= 0.15;
          base64 = canvas.toDataURL('image/jpeg', quality);
          sizeKB = calculateBase64SizeKB(base64);
        }

        // If still over targetMaxKB, scale canvas down further
        if (sizeKB > targetMaxKB) {
          const scaleCanvas = document.createElement('canvas');
          const scaleFactor = 0.7;
          scaleCanvas.width = Math.round(width * scaleFactor);
          scaleCanvas.height = Math.round(height * scaleFactor);
          const scaleCtx = scaleCanvas.getContext('2d');
          if (scaleCtx) {
            scaleCtx.fillStyle = '#FFFFFF';
            scaleCtx.fillRect(0, 0, scaleCanvas.width, scaleCanvas.height);
            scaleCtx.drawImage(canvas, 0, 0, scaleCanvas.width, scaleCanvas.height);
            base64 = scaleCanvas.toDataURL('image/jpeg', 0.6);
            sizeKB = calculateBase64SizeKB(base64);
            width = scaleCanvas.width;
            height = scaleCanvas.height;
          }
        }

        resolve({
          base64,
          sizeKB,
          width,
          height
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export function calculateBase64SizeKB(base64String: string): number {
  // Remove metadata prefix (e.g. data:image/jpeg;base64,)
  const base64Data = base64String.split(',')[1] || base64String;
  const padding = (base64Data.match(/=/g) || []).length;
  const bytes = (base64Data.length * 3) / 4 - padding;
  return Math.round((bytes / 1024) * 10) / 10;
}
