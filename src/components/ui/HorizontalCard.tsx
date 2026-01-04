import React from "react";
import Image from "next/image";

interface HorizontalCardProps {
  title: string;
  day: string;
  time?: string;
  image: string; // image src
  date?: string;
  notes?: number;
}

const HorizontalCard: React.FC<HorizontalCardProps> = ({
  title,
  day,
  time,
  image,
  date,
  notes,
}) => {
  return (
    <div
      className="flex items-center bg-white rounded-2xl shadow-lg p-3 md:p-4 w-full min-h-[90px] transition-colors"
      style={{
        boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
        fontFamily: "Fredoka, Arial, sans-serif",
      }}
    >
      <div className="rounded-xl p-2 md:p-3 shrink-0" style={{ background: "#FEF1CA" }}>
        <Image
          src={image}
          alt={title}
          width={32}
          height={32}
          className="object-cover w-6 h-6 md:w-8 md:h-8"
        />
      </div>
      <div className="flex-1 ml-3 md:ml-4 min-w-0">
        <div className="font-bold text-base md:text-lg text-gray-800 truncate">{title}</div>
        <div className="text-sm md:text-base text-gray-500 truncate">
          {day}
          {date ? `, ${date}` : ""}
        </div>
      </div>
      <div className="flex flex-col items-end ml-2 md:ml-4 shrink-0">
        {time && (
          <div className="flex items-center mb-1">
            <span className="bg-red-500 text-white text-xs md:text-sm px-2 md:px-3 py-1 rounded-full font-bold whitespace-nowrap">
              {time}
            </span>
          </div>
        )}
        {typeof notes === "number" && (
          <div className="text-xs md:text-sm text-gray-600 font-medium whitespace-nowrap">
            Notes: {notes}
          </div>
        )}
      </div>
    </div>
  );
};

export default HorizontalCard;
