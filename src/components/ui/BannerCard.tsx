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
      className={`w-full p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-4 relative ${bgColor}`}
      style={{ background: bgColor?.startsWith('bg-') ? undefined : bgColor, fontFamily: 'Fredoka, Arial, sans-serif' }}
    >
      <div className="w-full flex flex-col items-center">
        <div
          className="flex items-center justify-center rounded-xl mb-4"
          style={{ background: imageBgColor, width: '7.5rem', height: '7.5rem', maxWidth: '100%' }}
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
            width={100}
            height={100}
            className="object-contain rounded-xl border-4 border-orange-200 shadow-lg"
            style={{ width: '5.5rem', height: '5.5rem', animation: 'bannerImageZoom 2.5s infinite', maxWidth: '100%' }}
          />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2 text-center w-full">{title}</h2>
        {description && <p className="text-gray-700 mb-4 text-center w-full">{description}</p>}
        <div className="w-full flex justify-center">
          {(() => {
          // Try to extract a color from buttonColor class string
          let shadowColor = 'rgba(255,140,0,0.18)'; // default orange
          if (buttonColor) {
            // Try to match hex or rgb color in the string
            const hexMatch = buttonColor.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/);
            if (hexMatch) {
              // Use hex color with some opacity
              shadowColor = hexToRgba(hexMatch[0], 0.18);
            } else {
              // Try to match rgb or rgba
              const rgbMatch = buttonColor.match(/rgb[a]?\([^)]*\)/);
              if (rgbMatch) {
                shadowColor = rgbMatch[0].replace(/\)$/,'') + ',0.18)';
              } else if (buttonColor.includes('bg-[#5B5BFF]')) {
                shadowColor = 'rgba(91,91,255,0.18)';
              } else if (buttonColor.includes('bg-orange-500')) {
                shadowColor = 'rgba(255,140,0,0.18)';
              }
            }
          }

          function hexToRgba(hex: string, alpha: number): string {
            let c = hex.substring(1);
            if (c.length === 3) c = c.split('').map((x: string) => x + x).join('');
            const num = parseInt(c, 16);
            const r = (num >> 16) & 255;
            const g = (num >> 8) & 255;
            const b = num & 255;
            return `rgba(${r},${g},${b},${alpha})`;
          }

          return (
            <button
              className={`mt-2 w-full max-w-xs px-5 py-3 rounded-full text-white font-bold transition-all duration-200 ${buttonColor} hover:scale-105`}
              onClick={onButtonClick}
              style={{ boxShadow: `0 8px 0 0 ${shadowColor}` }}
            >
              {buttonText}
            </button>
          );
          })()}
        </div>
      </div>
    </div>
  );
};

export default BannerCard;