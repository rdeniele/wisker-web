import React from 'react';
import QuickActionCard from '@/components/ui/QuickActionCard';

function CreateFlasCard() {
  return (
    <QuickActionCard
      bgColor="#D6EAFF"
      imageSrc="/images/wisky-cards.png" // Place your image in public/images/ui/cat-flashcard.png
      text={"Create Flash\nCards"}
      textColor="#4A90E2"
      style={{ boxShadow: '0 4px 0 0 #a3b8d8' }}
    />
  );
}

export default CreateFlasCard;