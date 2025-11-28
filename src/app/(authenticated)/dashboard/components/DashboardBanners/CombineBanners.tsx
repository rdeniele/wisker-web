import React from 'react';
import FreeTrialBanner from './FreeTrialBanner';
import LearnMoreBanner from './LearnMoreBanner';

function CombineBanners() {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
      <FreeTrialBanner />
      <LearnMoreBanner />
    </div>
  );
}

export default CombineBanners;