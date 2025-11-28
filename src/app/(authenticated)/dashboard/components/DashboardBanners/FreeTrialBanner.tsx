'use client';

import React from 'react';
import BannerCard from '@/components/ui/BannerCard';

function FreeTrialBanner() {
  return (
    <BannerCard
      title={
        <span>
          <span className="font-bold text-xl text-gray-900 block">Not ready to commit?</span>
          <span className="text-lg text-gray-900 block mt-1">7 days on us — decide later, no pressure.</span>
        </span>
      }
      description={"Try Wisker for free. Cancel anytime."}
      imageSrc="/images/wisky-sad.png"
      bgColor="#FEF1CA"
      bgGradient="linear-gradient(90deg, #fffbe6 0%, #ffe5b4 100%)"
      imageBgColor="#E4DFFF"
      buttonText="START FREE TRIAL"
      buttonColor="bg-orange-500 hover:bg-orange-600"
      onButtonClick={() => alert('Free trial started!')}
    />
  );
}

export default FreeTrialBanner;