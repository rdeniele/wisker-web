import React from "react";
import Image from "next/image";

interface HistoryCardProps {
  imageSrc: string;
  title: string;
  createdSecondsAgo: number;
}

const HistoryCard: React.FC<HistoryCardProps> = ({
  imageSrc,
  title,
  createdSecondsAgo,
}) => {
  // Format seconds ago to a readable string
  let createdText = "";
  if (createdSecondsAgo < 60) {
    createdText = `Created ${createdSecondsAgo} seconds ago`;
  } else if (createdSecondsAgo < 3600) {
    createdText = `Created ${Math.floor(createdSecondsAgo / 60)} minutes ago`;
  } else {
    createdText = `Created ${Math.floor(createdSecondsAgo / 3600)} hours ago`;
  }

  return (
    <div
      className="rounded-2xl bg-white p-5 flex flex-col items-center justify-between shadow-[0_4px_0_0_rgba(91,91,255,0.08)] border border-[#F3F3F3]"
      style={{
        width: 220,
        minHeight: 220,
        maxWidth: 220,
        height: 220,
        flexShrink: 0,
        flexGrow: 0,
        fontFamily: "Fredoka, Arial, sans-serif",
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <Image
          src={imageSrc}
          alt={title}
          width={48}
          height={48}
          className="object-contain"
        />
      </div>
      <div className="font-fredoka font-bold text-xl text-gray-900 text-center mb-1">
        {title}
      </div>
      <div className="text-gray-400 text-sm text-center mt-2">
        {createdText}
      </div>
    </div>
  );
};

export default HistoryCard;
