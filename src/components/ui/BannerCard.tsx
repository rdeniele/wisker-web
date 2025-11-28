import React from 'react';
import Image from 'next/image';

interface BannerCardProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  imageSrc: string;
  bgColor?: string;
  bgGradient?: string;
  imageBgColor?: string;
  buttonText: string;
  buttonColor?: string;
  onButtonClick?: () => void;
}

const BannerCard: React.FC<BannerCardProps> = ({
  title,
  description,
  imageSrc,
  bgColor = 'bg-[#E4DFFF]', // default to purple
  imageBgColor = '#E4DFFF',
  buttonText,
  buttonColor = 'bg-orange-500 hover:bg-orange-600',
  onButtonClick,
}) => {
  return (
    <div
      className={`w-full p-6 rounded-2xl shadow-lg flex items-center justify-between gap-4 relative ${bgColor}`}
      style={{ background: bgColor?.startsWith('bg-') ? undefined : bgColor }}
    >
      <div className="shrink-0 flex items-center h-full mr-4">
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ background: imageBgColor, width: '8.5rem', height: '8.5rem' }}
        >
          <style jsx>{`
            @keyframes bannerImageZoom {
              0% { transform: scale(1) rotate(0deg); }
              50% { transform: scale(1.08) rotate(-4deg); }
              100% { transform: scale(1) rotate(0deg); }
            }
          `}</style>
          <Image
            src={imageSrc}
            alt={typeof title === 'string' ? title : 'Banner image'}
            width={120}
            height={120}
            className="object-contain rounded-xl border-4 border-orange-200 shadow-lg"
            style={{ width: '7.5rem', height: '7.5rem', animation: 'bannerImageZoom 2.5s infinite' }}
          />
        </div>
      </div>
      <div className="flex flex-col justify-center flex-1">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{title}</h2>
        {description && <p className="text-gray-700 mb-4">{description}</p>}
        <button
          className={`mt-2 w-full max-w-xs px-5 py-3 rounded-full text-white font-bold transition-all duration-200 ${buttonColor} hover:scale-105 shadow-md`}
          onClick={onButtonClick}
          style={{ boxShadow: '0 4px 12px rgba(255,140,0,0.12)' }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default BannerCard;