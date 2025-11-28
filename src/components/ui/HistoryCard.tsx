import React from 'react';
import Image from 'next/image';

interface HistoryCardProps {
  imageSrc: string;
  title: string;
  createdSecondsAgo: number;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ imageSrc, title, createdSecondsAgo }) => {
  // Format seconds ago to a readable string
  let createdText = '';
  if (createdSecondsAgo < 60) {
    createdText = `Created ${createdSecondsAgo} seconds ago`;
  } else if (createdSecondsAgo < 3600) {
    createdText = `Created ${Math.floor(createdSecondsAgo / 60)} minutes ago`;
  } else {
    createdText = `Created ${Math.floor(createdSecondsAgo / 3600)} hours ago`;
  }

  return (
    <div className="rounded-xl bg-white p-5 flex flex-col items-center w-56 h-56 justify-between shadow-[0_8px_0_0_rgba(0,0,0,0.18)]">
      <div className="flex flex-col items-center gap-2">
        <Image src={imageSrc} alt={title} width={48} height={48} className="object-contain" />
      </div>
      <div className="font-semibold text-lg text-gray-900 text-center mb-1">{title}</div>
      <div className="text-gray-400 text-sm text-center mt-2">{createdText}</div>
    </div>
  );
};

export default HistoryCard;