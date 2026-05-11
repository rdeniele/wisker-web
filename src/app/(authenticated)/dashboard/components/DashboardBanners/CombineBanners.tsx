import React from "react";
import { SHOW_SUBSCRIPTION_UI } from "@/lib/subscription-ui-visibility";
import FreeTrialBanner from "./FreeTrialBanner";
import LearnMoreBanner from "./LearnMoreBanner";

function CombineBanners() {
  return (
    <div
      className={`w-full grid gap-4 md:gap-6 ${SHOW_SUBSCRIPTION_UI ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
    >
      {SHOW_SUBSCRIPTION_UI && <FreeTrialBanner />}
      <LearnMoreBanner />
    </div>
  );
}

export default CombineBanners;
