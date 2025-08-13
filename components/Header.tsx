import React from 'react';
import { ImageIcon } from './icons';
import ThemeToggle from './ThemeToggle';

/**
 * Renders the main header for the application.
 * Displays the application title, a brief description, and the theme toggle switch.
 */
const Header = () => {
  return (
    <header className="sticky top-0 z-10 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <ImageIcon className="h-10 w-10 text-indigo-600" />
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    Asset Generator Pro
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">PWA & Extension Icon Sets from a single image</p>
            </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;