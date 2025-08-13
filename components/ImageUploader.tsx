import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';
import type { ImageInfo } from '../types';

/**
 * Props for the ImageUploader component.
 */
interface ImageUploaderProps {
  /** Callback function invoked when a new image file is selected. */
  onImageSelect: (file: File) => void;
  /** Information about the currently selected image, for displaying a preview. Null if no image is selected. */
  imageInfo: ImageInfo | null;
}

/**
 * A component that provides a user interface for uploading image files.
 * It supports both drag-and-drop and traditional file input selection.
 */
const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, imageInfo }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageSelect(event.target.files[0]);
    }
  };

  const handleDragEvents = useCallback((e: React.DragEvent<HTMLLabelElement>, dragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(dragging);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (e.dataTransfer.files[0].type.startsWith('image/')) {
        onImageSelect(e.dataTransfer.files[0]);
      }
    }
  }, [handleDragEvents, onImageSelect]);

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        onDragEnter={(e) => handleDragEvents(e, true)}
        onDragLeave={(e) => handleDragEvents(e, false)}
        onDragOver={(e) => handleDragEvents(e, true)}
        onDrop={handleDrop}
        className={`relative group flex justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 py-10 transition-all duration-300 ease-in-out cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 ${
          isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-gray-800 scale-105' : ''
        }`}
      >
        <div className="text-center">
          {imageInfo ? (
            <div className="flex flex-col items-center">
              <img src={imageInfo.url} alt="Preview" className="max-h-48 rounded-lg shadow-md bg-white dark:bg-gray-700" />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white font-semibold">Click or drag to replace</p>
              </div>
              <p className="mt-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
                {imageInfo.width}px &times; {imageInfo.height}px
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
              <UploadIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
              <div className="mt-4 flex text-sm leading-6">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Upload a file</span>
                  <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs leading-5">PNG, JPG, etc. up to 10MB</p>
            </div>
          )}
        </div>
        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
      </label>
    </div>
  );
};

export default ImageUploader;