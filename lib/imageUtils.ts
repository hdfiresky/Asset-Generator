import type { Asset } from '../types';

/**
 * Creates an HTMLImageElement from a File object.
 * @param file The image file selected by the user.
 * @returns A promise that resolves to an HTMLImageElement.
 */
export const createImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Creates an HTMLImageElement from a URL (e.g., a data URL).
 * @param url The URL of the image.
 * @returns A promise that resolves to an HTMLImageElement.
 */
export const createImageFromUrl = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
};

/**
 * Removes the white background from an image using a canvas.
 * Pixels that are "close" to white are made fully transparent.
 * @param image The source HTMLImageElement.
 * @returns A promise that resolves to a data URL string of the image in PNG format with a transparent background.
 */
export const removeWhiteBackground = (image: HTMLImageElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return reject(new Error('Could not get canvas context'));
    
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    // Tolerance defines how close a color must be to white (255, 255, 255) to be made transparent.
    // A higher value is more aggressive in removing near-white colors.
    const tolerance = 20; 

    for (let i = 0; i < data.length; i += 4) {
      // Check if the RGB values are all above the white threshold
      if (data[i] > 255 - tolerance && data[i+1] > 255 - tolerance && data[i+2] > 255 - tolerance) {
        data[i+3] = 0; // Set alpha to transparent
      }
    }
    ctx.putImageData(imageData, 0, 0);
    resolve(canvas.toDataURL('image/png'));
  });
};

/**
 * Resizes an image to the specified dimensions, preserving its aspect ratio by "letterboxing" it.
 * The output image will have the exact target dimensions, with transparent padding if necessary.
 * @param image The source HTMLImageElement to resize.
 * @param width The target width of the output image.
 * @param height The target height of the output image.
 * @param name The desired filename for the output asset.
 * @param format The desired output image format.
 * @param quality The quality setting for lossy formats like 'image/webp'.
 * @returns A promise that resolves to an Asset object containing the resized image blob, its URL, and dimensions.
 */
export const resizeImage = (
    image: HTMLImageElement, 
    width: number, 
    height: number, 
    name:string,
    format: 'image/png' | 'image/webp' = 'image/png',
    quality?: number
): Promise<Asset> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context for resizing'));

        // Calculate the best-fit ratio to preserve aspect ratio
        const hRatio = canvas.width / image.width;
        const vRatio = canvas.height / image.height;
        const ratio = Math.min(hRatio, vRatio);
        
        // Calculate the position to center the image on the canvas
        const centerShiftX = (canvas.width - image.width * ratio) / 2;
        const centerShiftY = (canvas.height - image.height * ratio) / 2;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
            image, 0, 0, image.width, image.height,
            centerShiftX, centerShiftY, image.width * ratio, image.height * ratio
        );

        // Convert the canvas content to a Blob
        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                resolve({ name, blob, url, width, height });
            } else {
                reject(new Error('Canvas to Blob conversion failed'));
            }
        }, format, quality);
    });
};