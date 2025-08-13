
import React, { useState, useCallback, useEffect } from 'react';
import type { Asset, GeneratedAssetSets, ImageInfo } from './types';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import AssetPreview from './components/AssetPreview';
import Spinner from './components/Spinner';
import { DownloadIcon } from './components/icons';
// Import image processing utilities from a separate module for better code organization.
import { createImageFromFile, createImageFromUrl, removeWhiteBackground, resizeImage } from './lib/imageUtils';

// JSZip is loaded from a CDN in index.html, so we declare it here to inform TypeScript.
declare var JSZip: any;

/**
 * The main application component. It manages the state and logic for
 * uploading an image, processing it, and displaying the generated assets.
 */
const App: React.FC = () => {
  // State for the original uploaded file.
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  // State for storing the preview URL and dimensions of the uploaded image.
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  // State for holding the generated asset sets (PWA and Extension icons).
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAssetSets | null>(null);
  // State to track if the application is currently processing an image.
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // State to hold any error messages that occur during processing.
  const [error, setError] = useState<string | null>(null);

  // Effect hook to clean up blob URLs to prevent memory leaks.
  // This runs when the component unmounts or when `generatedAssets` changes.
  useEffect(() => {
    return () => {
      if (generatedAssets) {
        // Revoke object URLs for all assets in both sets.
        [...generatedAssets.pwa, ...generatedAssets.extension].forEach(asset => {
          URL.revokeObjectURL(asset.url);
        });
      }
    };
  }, [generatedAssets]);

  /**
   * Callback function triggered when a new image is selected via the ImageUploader.
   * @param file The image file selected by the user.
   */
  const handleImageSelect = useCallback((file: File) => {
    setOriginalFile(file);
    setGeneratedAssets(null); // Clear previous results
    setError(null); // Clear previous errors

    // Create a preview of the image.
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

  /**
   * Handles the entire asset generation process.
   * This function is asynchronous and orchestrates background removal and resizing.
   */
  const handleGenerateAssets = async () => {
    if (!originalFile) return;

    setIsLoading(true);
    setError(null);
    setGeneratedAssets(null);

    try {
        // Step 1: Create an image element from the uploaded file.
        const originalImage = await createImageFromFile(originalFile);
        // Step 2: Remove the white background, returning a transparent PNG data URL.
        const transparentImageUrl = await removeWhiteBackground(originalImage);
        // Step 3: Create a new image element from the transparent version. This will be the source for resizing.
        const processedImage = await createImageFromUrl(transparentImageUrl);

        // Define the target sizes for Progressive Web App (PWA) icons.
        const pwaSizes = [
            { name: 'apple-touch-icon.png', width: 512, height: 512 },
            { name: 'pwa-512x512.png', width: 512, height: 512 },
            { name: 'pwa-192x192.png', width: 192, height: 192 },
            { name: 'favicon.png', width: 32, height: 32 },
        ];

        // Define the target sizes for Browser Extension icons.
        const extensionSizes = [
            { name: 'logo.png', width: 1024, height: 1024 },
            { name: 'icon128.png', width: 128, height: 128 },
            { name: 'icon48.png', width: 48, height: 48 },
            { name: 'icon16.png', width: 16, height: 16 },
        ];
        
        // Step 4: Create resizing promises for all target sizes. This allows for parallel processing.
        const pwaPromises = pwaSizes.map(s => resizeImage(processedImage, s.width, s.height, s.name));
        const extPromises = extensionSizes.map(s => resizeImage(processedImage, s.width, s.height, s.name));

        // Step 5: Wait for all resize operations to complete.
        const pwaAssets = await Promise.all(pwaPromises);
        const extensionAssets = await Promise.all(extPromises);

        // Step 6: Set the final generated assets in the state.
        setGeneratedAssets({ pwa: pwaAssets, extension: extensionAssets });

    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unexpected error occurred during asset generation.');
    } finally {
        setIsLoading(false); // Ensure loading is turned off, even if an error occurs.
    }
  };

  /**
   * Handles the creation and download of a zip file containing a set of assets.
   * @param assets The array of Asset objects to include in the zip.
   * @param zipName The base name for the downloaded zip file.
   */
  const handleDownloadZip = async (assets: Asset[], zipName: string) => {
    const zip = new JSZip();
    // Add each asset's blob to the zip archive.
    assets.forEach(asset => {
        zip.file(asset.name, asset.blob);
    });

    try {
        // Generate the zip file as a blob.
        const content = await zip.generateAsync({type:"blob"});
        
        // Create a temporary link element to trigger the download.
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${zipName}.zip`;
        document.body.appendChild(link);
        link.click();
        
        // Clean up the temporary link and its object URL.
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
                        {/* Loading State */}
                        {isLoading && (
                            <div className="text-center">
                                <Spinner />
                                <p className="mt-2 text-sm text-gray-600">Processing your image...</p>
                            </div>
                        )}
                        {/* Error State */}
                        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
                        
                        {/* Initial State */}
                        {!isLoading && !error && !generatedAssets && (
                            <p className="text-center text-gray-500">Your generated assets will appear here.</p>
                        )}
                        
                        {/* Success State: Display generated assets */}
                        {generatedAssets && (
                            <div className="w-full space-y-8">
                                {/* PWA Assets Section */}
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
                                {/* Browser Extension Assets Section */}
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
