import React, { useState, useCallback } from 'react';
import type { Asset, GeneratedAssetSets, ImageInfo } from './types';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import Spinner from './components/Spinner';
import Step from './components/Step';
import ResultDisplay from './components/ResultDisplay';
import { createImageFromUrl, removeWhiteBackground, resizeImage } from './lib/imageUtils';
import { DownloadIcon } from './components/icons';

declare var JSZip: any;

/**
 * The main application component. It manages the state and logic for
 * uploading an image, processing it, and displaying the generated assets
 * through a multi-step wizard interface.
 */
const App: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState<string | null>(null);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAssetSets | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [shouldRemoveBackground, setShouldRemoveBackground] = useState<boolean>(true);

  useEffect(() => {
    return () => {
      if (generatedAssets) {
        [...generatedAssets.pwa, ...generatedAssets.extension].forEach(asset => URL.revokeObjectURL(asset.url));
      }
      if (processedPreviewUrl) {
        URL.revokeObjectURL(processedPreviewUrl);
      }
    };
  }, [generatedAssets, processedPreviewUrl]);

  const resetState = () => {
    setOriginalFile(null);
    setImageInfo(null);
    setGeneratedAssets(null);
    setProcessedPreviewUrl(null);
    setError(null);
    setCurrentStep(1);
  };

  const handleImageSelect = useCallback(async (file: File) => {
    resetState();
    setOriginalFile(file);
    setIsLoading(true);
    setLoadingMessage(shouldRemoveBackground ? 'Removing background...' : 'Processing image...');
    setCurrentStep(1.5); // Intermediate step for processing

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          setImageInfo({ url: img.src, width: img.width, height: img.height });
          try {
            if (shouldRemoveBackground) {
                const originalImage = await createImageFromUrl(img.src);
                const transparentImageUrl = await removeWhiteBackground(originalImage);
                setProcessedPreviewUrl(transparentImageUrl);
            } else {
                setProcessedPreviewUrl(img.src);
            }
            setCurrentStep(2);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to process image background.');
            setCurrentStep(1);
          } finally {
            setIsLoading(false);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to read image file.');
        setCurrentStep(1);
        setIsLoading(false);
    }
  }, [shouldRemoveBackground]);

  const handleGenerateAssets = async () => {
    if (!processedPreviewUrl) return;

    setIsLoading(true);
    setLoadingMessage('Generating assets...');
    setError(null);

    try {
        const processedImage = await createImageFromUrl(processedPreviewUrl);
        const pwaSizes = [{ name: 'apple-touch-icon.png', width: 512, height: 512 }, { name: 'pwa-512x512.png', width: 512, height: 512 }, { name: 'pwa-192x192.png', width: 192, height: 192 }, { name: 'favicon.png', width: 32, height: 32 }];
        const extensionSizes = [{ name: 'logo.png', width: 1024, height: 1024 }, { name: 'icon128.png', width: 128, height: 128 }, { name: 'icon48.png', width: 48, height: 48 }, { name: 'icon16.png', width: 16, height: 16 }];
        
        const pwaPromises = pwaSizes.map(s => resizeImage(processedImage, s.width, s.height, s.name));
        const extPromises = extensionSizes.map(s => resizeImage(processedImage, s.width, s.height, s.name));

        const pwaAssets = await Promise.all(pwaPromises);
        const extensionAssets = await Promise.all(extPromises);

        setGeneratedAssets({ pwa: pwaAssets, extension: extensionAssets });
        setCurrentStep(3);

    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unexpected error occurred during asset generation.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleDownloadZip = async (type: 'pwa' | 'extension') => {
    if (!generatedAssets) return;
    const assets = generatedAssets[type];
    const zipName = `${type}_assets`;
    const zip = new JSZip();
    assets.forEach(asset => zip.file(asset.name, asset.blob));

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

  const handleDownloadSvg = () => {
    if (!processedPreviewUrl || !imageInfo) return;

    const svgContent = `<svg width="${imageInfo.width}" height="${imageInfo.height}" viewBox="0 0 ${imageInfo.width} ${imageInfo.height}" xmlns="http://www.w3.org/2000/svg">
  <image href="${processedPreviewUrl}" x="0" y="0" width="${imageInfo.width}" height="${imageInfo.height}" />
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = originalFile?.name.replace(/\.[^/.]+$/, '') || 'logo';
    link.download = `${fileName}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-gray-800 dark:bg-slate-900 dark:text-gray-300 transition-colors duration-300">
        <Header />
        <main className="flex-grow max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-8">
                {error && <p className="text-sm text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg font-medium">{error}</p>}
                
                <Step stepNumber={1} title="Upload Your Logo" isCompleted={currentStep > 1} isActive={currentStep === 1}>
                    <ImageUploader onImageSelect={handleImageSelect} imageInfo={imageInfo} />
                    <div className="mt-6 flex items-center justify-center">
                        <label htmlFor="bg-toggle" className="flex items-center cursor-pointer select-none">
                            <span className="mr-3 text-sm font-medium text-gray-900 dark:text-gray-300">Remove white background</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    id="bg-toggle"
                                    className="sr-only peer"
                                    checked={shouldRemoveBackground}
                                    onChange={() => setShouldRemoveBackground(prev => !prev)}
                                    disabled={!!imageInfo}
                                />
                                <div className={`
                                    w-11 h-6 bg-gray-200 rounded-full 
                                    peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800
                                    dark:bg-gray-700
                                    peer-checked:after:translate-x-full peer-checked:after:border-white
                                    after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                    after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                                    after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600
                                    ${!!imageInfo ? 'cursor-not-allowed opacity-60' : ''}
                                `}></div>
                            </div>
                        </label>
                    </div>
                    {isLoading && currentStep < 2 && (
                         <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                             <Spinner className="h-5 w-5 text-indigo-500"/>
                             <span>{loadingMessage}</span>
                         </div>
                    )}
                </Step>

                <Step stepNumber={2} title="Preview & Generate" isCompleted={currentStep > 2} isActive={currentStep === 2}>
                    {processedPreviewUrl && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {shouldRemoveBackground 
                                    ? "We've removed the background. If it looks good, generate the final assets."
                                    : "Preview of your original image. If it looks good, generate the final assets."
                                }
                            </p>
                            <div className="flex justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                <img src={processedPreviewUrl} alt="Processed preview" className="max-h-48 rounded-md" />
                            </div>
                            <div className="flex flex-col sm:flex-row-reverse gap-3">
                                <button
                                    onClick={handleGenerateAssets}
                                    disabled={isLoading}
                                    className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:ring-offset-slate-900 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoading ? (
                                        <>
                                            <Spinner className="h-5 w-5 mr-2" />
                                            {loadingMessage}
                                        </>
                                    ) : 'Generate Assets'}
                                </button>
                                <button
                                    onClick={handleDownloadSvg}
                                    className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:ring-offset-slate-900 transition-colors"
                                >
                                    <DownloadIcon className="h-5 w-5 mr-2" />
                                    Download SVG
                                </button>
                            </div>
                        </div>
                    )}
                </Step>
                
                <Step stepNumber={3} title="Download Your Assets" isCompleted={currentStep === 3} isActive={currentStep === 3}>
                    {generatedAssets ? (
                        <ResultDisplay assets={generatedAssets} onDownload={handleDownloadZip} />
                    ) : (
                        <div className="flex items-center justify-center h-40 rounded-lg bg-gray-100 dark:bg-gray-800/50">
                            <p className="text-gray-500 dark:text-gray-400">Your generated assets will appear here.</p>
                        </div>
                    )}
                </Step>
            </div>
        </main>
        <footer className="bg-slate-100 dark:bg-slate-800 transition-colors">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>&copy; {new Date().getFullYear()} Asset Generator Pro. All rights reserved.</p>
            </div>
        </footer>
    </div>
  );
};

export default App;