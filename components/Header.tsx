
import React from 'react';
import { ImageIcon } from './icons';

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center space-x-4">
        <ImageIcon className="h-10 w-10 text-indigo-600" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Asset Generator Pro
            </h1>
            <p className="text-sm text-gray-500">PWA & Extension Icon Sets from a single image</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
