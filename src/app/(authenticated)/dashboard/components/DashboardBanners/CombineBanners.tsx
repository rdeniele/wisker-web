import React from "react";
import FreeTrialBanner from "./FreeTrialBanner";
import LearnMoreBanner from "./LearnMoreBanner";

function CombineBanners() {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <FreeTrialBanner />
      <LearnMoreBanner />
    </div>
  );
}

export default CombineBanners;
