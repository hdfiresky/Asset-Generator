import React, { useState } from 'react';
import type { GeneratedAssetSets } from '../types';
import AssetPreview from './AssetPreview';
import { DownloadIcon } from './icons';

interface ResultDisplayProps {
  assets: GeneratedAssetSets;
  onDownload: (type: 'pwa' | 'extension') => void;
}

type ActiveTab = 'pwa' | 'extension';

const ResultDisplay: React.FC<ResultDisplayProps> = ({ assets, onDownload }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pwa');

  const getTabClass = (tabName: ActiveTab) => {
    return activeTab === tabName
      ? 'bg-indigo-600 text-white'
      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700';
  };
  
  const currentAssets = assets[activeTab];

  return (
    <div className="w-full space-y-4">
      {/* Tab Buttons */}
      <div className="flex space-x-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
        <button onClick={() => setActiveTab('pwa')} className={`w-full rounded-md py-2.5 text-sm font-medium leading-5 transition-colors ${getTabClass('pwa')}`}>
          PWA Assets ({assets.pwa.length})
        </button>
        <button onClick={() => setActiveTab('extension')} className={`w-full rounded-md py-2.5 text-sm font-medium leading-5 transition-colors ${getTabClass('extension')}`}>
          Extension Assets ({assets.extension.length})
        </button>
      </div>

      {/* Content */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">
                {activeTab === 'pwa' ? 'PWA Assets' : 'Browser Extension Assets'}
            </h3>
            <button 
              onClick={() => onDownload(activeTab)} 
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:ring-offset-slate-900 transition-colors"
            >
                <DownloadIcon className="w-5 h-5" />
                Download .zip
            </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {currentAssets.map(asset => <AssetPreview key={asset.name} asset={asset} />)}
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
