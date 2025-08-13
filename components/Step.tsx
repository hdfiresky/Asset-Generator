import React, { ReactNode } from 'react';
import { CheckIcon } from './icons';

interface StepProps {
  stepNumber: number;
  title: string;
  isCompleted: boolean;
  isActive: boolean;
  children: ReactNode;
}

const Step: React.FC<StepProps> = ({ stepNumber, title, isCompleted, isActive, children }) => {
  const stepStatusClasses = isCompleted 
    ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400" 
    : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400";

  const getBorderClass = () => {
    if (!isActive && !isCompleted) return 'border-gray-300 dark:border-gray-700 border-dashed';
    if (isCompleted) return 'border-green-300 dark:border-green-600';
    return 'border-indigo-300 dark:border-indigo-600';
  }

  return (
    <div className={`transition-opacity duration-500 ${isActive || isCompleted ? 'opacity-100' : 'opacity-50'}`}>
      <div className="flex items-center space-x-4">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold ${stepStatusClasses}`}>
          {isCompleted ? <CheckIcon className="h-6 w-6" /> : stepNumber}
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{title}</h2>
      </div>
      <div className={`mt-4 ml-[19px] pl-8 border-l-2 ${getBorderClass()}`}>
        <div className="pb-4">
            {children}
        </div>
      </div>
    </div>
  );
};

export default Step;
