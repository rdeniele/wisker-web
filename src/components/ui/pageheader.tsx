import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  centered?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  className = '',
  centered = true,
}) => {
  return (
    <div className={`w-full ${centered ? 'text-center' : 'text-left'} ${className}`}>
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 leading-tight font-fredoka">
        {title}
      </h1>
      {subtitle && (
        <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 font-normal leading-relaxed max-w-2xl mx-auto font-poppins">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default PageHeader;