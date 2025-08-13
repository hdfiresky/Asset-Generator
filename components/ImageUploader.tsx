
import React, { useState, useCallback } from 'react';
import { UploadIcon, ImageIcon } from './icons';
import type { ImageInfo } from '../types';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  imageInfo: ImageInfo | null;
}

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
        if(e.dataTransfer.files[0].type.startsWith('image/')){
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
        className={`mt-2 flex justify-center rounded-lg border-2 border-dashed ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'} px-6 py-10 transition-colors duration-200 cursor-pointer`}
      >
        <div className="text-center">
          {imageInfo ? (
            <div className='flex flex-col items-center'>
              <img src={imageInfo.url} alt="Preview" className="max-h-48 rounded-lg shadow-md" />
              <p className="mt-4 text-sm font-semibold text-gray-700">
                {imageInfo.width}px &times; {imageInfo.height}px
              </p>
              <p className="mt-1 text-xs text-gray-500">Click or drag to replace image</p>
            </div>
          ) : (
            <>
              <UploadIcon />
              <div className="mt-4 flex text-sm leading-6 text-gray-600">
                <p className="pl-1">
                  <span className="font-semibold text-indigo-600">Upload a file</span> or drag and drop
                </p>
              </div>
              <p className="text-xs leading-5 text-gray-600">PNG, JPG, etc. up to 10MB</p>
            </>
          )}
        </div>
        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
      </label>
    </div>
  );
};

export default ImageUploader;
