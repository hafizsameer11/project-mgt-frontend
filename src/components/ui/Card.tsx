import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, title, footer }) => {
  return (
    <div className={cn('bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-xl', className)}>
      {title && (
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          {footer}
        </div>
      )}
    </div>
  );
};

