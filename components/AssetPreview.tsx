
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
    <div className="group relative flex flex-col items-center justify-center space-y-2 rounded-lg border border-slate-200 bg-slate-100 p-3 text-center shadow-sm transition-all hover:shadow-md hover:border-indigo-300">
      <img
        src={asset.url}
        alt={asset.name}
        className="h-16 w-16 object-contain"
        aria-label={`Preview of ${asset.name}`}
      />
      <div className="text-xs font-medium text-slate-700">
        <p className="break-all">{asset.name}</p>
        <p className="text-slate-500">{`${asset.width}x${asset.height}`}</p>
      </div>
    </div>
  );
};

export default AssetPreview;
