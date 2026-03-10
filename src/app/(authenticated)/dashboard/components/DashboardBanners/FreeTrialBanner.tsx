"use client";

import React from "react";
import { useRouter } from "next/navigation";
import BannerCard from "@/components/ui/BannerCard";

function FreeTrialBanner() {
  const router = useRouter();

  return (
    <BannerCard
      title={
        <span>
          <span className="font-bold text-xl text-gray-900 block">
            Not ready to commit?
          </span>
          <span className="text-lg text-gray-900 block mt-1">
            30 days on us — decide later, no pressure.
          </span>
        </span>
      }
      description={
        <span>
          Use promo code <span className="font-bold text-orange-600">WISKERTRIAL30</span> at checkout
        </span>
      }
      imageSrc="/images/wisky-sad.png"
      bgColor="#FEF1CA"
      bgGradient="linear-gradient(90deg, #fffbe6 0%, #ffe5b4 100%)"
      imageBgColor="#E4DFFF"
      buttonText="UPGRADE NOW"
      buttonColor="bg-orange-500 hover:bg-orange-600"
      onButtonClick={() => router.push("/upgrade")}
    />
  );
}

export default FreeTrialBanner;
