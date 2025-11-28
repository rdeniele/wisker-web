'use client';

import React from 'react';
import BannerCard from '@/components/ui/BannerCard';

function LearnMoreBanner() {
  return (
    <BannerCard
      title={
          <span>
            <span className="font-extrabold text-2xl text-gray-900 block">Learn with AI,</span>
            <span className="font-normal text-base text-gray-900 block mt-1">Power up your study grind in few minutes.</span>
          </span>
      }
      imageSrc="/images/wisky-gym.png"
      bgColor="#E4DFFF"
      imageBgColor="#FEF1CA"
      buttonText="LEARN MORE"
      buttonColor="bg-[#5B5BFF] hover:bg-[#6C6CFF]"
      onButtonClick={() => alert('Learn more clicked!')}
    />
  );
}

export default LearnMoreBanner;