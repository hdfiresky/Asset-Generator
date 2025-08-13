
import React, { useState, useCallback, useEffect } from 'react';
import type { Asset, GeneratedAssetSets, ImageInfo } from './types';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import AssetPreview from './components/AssetPreview';
import Spinner from './components/Spinner';
import { DownloadIcon } from './components/icons';

declare var JSZip: any;

// --- Image Utility Functions ---

const createImageFromFile = (file: File): Promise<HTMLImageElement> => {
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

const createImageFromUrl = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
};

const removeWhiteBackground = (image: HTMLImageElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return reject(new Error('Could not get canvas context'));
    
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const tolerance = 20; // How close to white to be considered "white"

    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 255 - tolerance && data[i+1] > 255 - tolerance && data[i+2] > 255 - tolerance) {
        data[i+3] = 0; // Set alpha to transparent
      }
    }
    ctx.putImageData(imageData, 0, 0);
    resolve(canvas.toDataURL('image/png'));
  });
};

const resizeImage = (image: HTMLImageElement, width: number, height: number, name: string): Promise<Asset> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context for resizing'));

        // Draw with aspect ratio preservation (letterboxing)
        const hRatio = canvas.width / image.width;
        const vRatio = canvas.height / image.height;
        const ratio = Math.min(hRatio, vRatio);
        const centerShiftX = (canvas.width - image.width * ratio) / 2;
        const centerShiftY = (canvas.height - image.height * ratio) / 2;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, image.width, image.height,
            centerShiftX, centerShiftY, image.width * ratio, image.height * ratio);

        canvas.toBlob((blob) => {
            if (blob) {
                resolve({ name, blob, url: URL.createObjectURL(blob), width, height });
            } else {
                reject(new Error('Canvas to Blob conversion failed'));
            }
        }, 'image/png');
    });
};

const App: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAssetSets | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clean up blob URLs when component unmounts or assets change
    return () => {
      if (generatedAssets) {
        [...generatedAssets.pwa, ...generatedAssets.extension].forEach(asset => {
          URL.revokeObjectURL(asset.url);
        });
      }
    };
  }, [generatedAssets]);

  const handleImageSelect = useCallback((file: File) => {
    setOriginalFile(file);
    setGeneratedAssets(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImageInfo({ url: img.src, width: img.width, height: img.height });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerateAssets = async () => {
    if (!originalFile) return;

    setIsLoading(true);
    setError(null);
    setGeneratedAssets(null);

    try {
        const originalImage = await createImageFromFile(originalFile);
        const transparentImageUrl = await removeWhiteBackground(originalImage);
        const processedImage = await createImageFromUrl(transparentImageUrl);

        const pwaSizes = [
            { name: 'apple-touch-icon.png', width: 512, height: 512 },
            { name: 'pwa-512x512.png', width: 512, height: 512 },
            { name: 'pwa-192x192.png', width: 192, height: 192 },
            { name: 'favicon.png', width: 32, height: 32 },
        ];

        const extensionSizes = [
            { name: 'logo.png', width: 1024, height: 1024 },
            { name: 'icon128.png', width: 128, height: 128 },
            { name: 'icon48.png', width: 48, height: 48 },
            { name: 'icon16.png', width: 16, height: 16 },
        ];
        
        const pwaPromises = pwaSizes.map(s => resizeImage(processedImage, s.width, s.height, s.name));
        const extPromises = extensionSizes.map(s => resizeImage(processedImage, s.width, s.height, s.name));

        const pwaAssets = await Promise.all(pwaPromises);
        const extensionAssets = await Promise.all(extPromises);

        setGeneratedAssets({ pwa: pwaAssets, extension: extensionAssets });

    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unexpected error occurred during asset generation.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleDownloadZip = async (assets: Asset[], zipName: string) => {
    const zip = new JSZip();
    assets.forEach(asset => {
        zip.file(asset.name, asset.blob);
    });

    try {
        const content = await zip.generateAsync({type:"blob"});
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${zipName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create zip file.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12">
                {/* Left Column: Uploader & Controls */}
                <div className="flex flex-col items-center">
                    <h2 className="text-xl font-semibold text-gray-800 self-start">1. Upload Your Logo</h2>
                    <ImageUploader onImageSelect={handleImageSelect} imageInfo={imageInfo} />
                    <button
                        onClick={handleGenerateAssets}
                        disabled={!originalFile || isLoading}
                        className="mt-6 w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Generating...' : '2. Generate Assets'}
                    </button>
                </div>

                {/* Right Column: Results */}
                <div className="mt-10 lg:mt-0">
                    <h2 className="text-xl font-semibold text-gray-800">3. Download Your Assets</h2>
                    <div className="mt-2 min-h-[300px] bg-white rounded-lg border border-gray-200 p-6 flex flex-col justify-center items-center space-y-6">
                        {isLoading && (
                            <div className="text-center">
                                <Spinner />
                                <p className="mt-2 text-sm text-gray-600">Processing your image...</p>
                            </div>
                        )}
                        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
                        
                        {!isLoading && !error && !generatedAssets && (
                            <p className="text-center text-gray-500">Your generated assets will appear here.</p>
                        )}
                        
                        {generatedAssets && (
                            <div className="w-full space-y-8">
                                <div className="p-4 border rounded-lg">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-gray-700">PWA Assets</h3>
                                        <button onClick={() => handleDownloadZip(generatedAssets.pwa, 'pwa_assets')} className="inline-flex items-center gap-2 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                                            <DownloadIcon className="w-4 h-4" />
                                            Download .zip
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {generatedAssets.pwa.map(asset => <AssetPreview key={asset.name} asset={asset} />)}
                                    </div>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-gray-700">Browser Extension Assets</h3>
                                        <button onClick={() => handleDownloadZip(generatedAssets.extension, 'extension_assets')} className="inline-flex items-center gap-2 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                                            <DownloadIcon className="w-4 h-4" />
                                            Download .zip
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {generatedAssets.extension.map(asset => <AssetPreview key={asset.name} asset={asset} />)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
        <footer className="bg-white">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
                <p>&copy; {new Date().getFullYear()} Asset Generator Pro. All rights reserved.</p>
            </div>
        </footer>
    </div>
  );
};

export default App;
