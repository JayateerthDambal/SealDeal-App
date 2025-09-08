import React from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li className="flex">
          <div className="flex items-center">
            <HomeIcon className="h-4 w-4 text-gray-400" />
            <span className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700">
              SealDeal
            </span>
          </div>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex">
            <div className="flex items-center">
              <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
              <span
                className={`text-sm font-medium ${
                  item.current 
                    ? 'text-gray-900 font-semibold' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;