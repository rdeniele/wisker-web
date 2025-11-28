import QuickActionCard from '@/components/ui/QuickActionCard';
import React from 'react'

function ClaimReward() {
    return (
    <QuickActionCard
      bgColor="#FFF3D1"
      imageSrc="/images/wisky-treasure.png" // Place your image in public/images/ui/cat-chest.png
      text={"Claim Your Daily\nRewards"}
      textColor="#D18B3B"
      style={{ boxShadow: '0 4px 0 0 #c7a76a' }}
    />
  );
}

export default ClaimReward