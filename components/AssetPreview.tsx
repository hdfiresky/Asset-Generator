import React from 'react';
import type { Asset } from '../types';

/**
 * Props for the AssetPreview component.
 */
interface AssetPreviewProps {
  /** The asset object to display. */
  asset: Asset;
}

/**
 * A component to display a single generated asset.
 * It shows a preview of the image, its name, and its dimensions.
 */
const AssetPreview: React.FC<AssetPreviewProps> = ({ asset }) => {
  return (
    <div className="group relative flex flex-col items-center justify-center space-y-2 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 text-center transition-all hover:shadow-lg hover:scale-105 hover:border-indigo-500 dark:hover:border-indigo-400">
      <img
        src={asset.url}
        alt={asset.name}
        className="h-16 w-16 object-contain"
        aria-label={`Preview of ${asset.name}`}
      />
      <div className="text-xs font-medium text-gray-700 dark:text-gray-200">
        <p className="break-all">{asset.name}</p>
        <p className="text-gray-500 dark:text-gray-400">{`${asset.width}x${asset.height}`}</p>
      </div>
    </div>
  );
};

export default AssetPreview;