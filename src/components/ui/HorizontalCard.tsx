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
      className="flex items-center bg-white rounded-2xl shadow-lg p-4 w-full min-h-[90px]"
      style={{
        boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
        fontFamily: "Fredoka, Arial, sans-serif",
      }}
    >
      <div className="rounded-xl p-3" style={{ background: "#FEF1CA" }}>
        <Image
          src={image}
          alt={title}
          width={32}
          height={32}
          className="object-cover"
        />
      </div>
      <div className="flex-1 ml-4">
        <div className="font-bold text-lg text-gray-800">{title}</div>
        <div className="text-base text-gray-500">
          {day}
          {date ? `, ${date}` : ""}
        </div>
      </div>
      <div className="flex flex-col items-end ml-4">
        {time && (
          <div className="flex items-center mb-1">
            <span className="bg-red-500 text-white text-base px-3 py-1 rounded-full font-bold">
              {time}
            </span>
          </div>
        )}
        {typeof notes === "number" && (
          <div className="text-base text-gray-600 font-medium">
            Notes: {notes}
          </div>
        )}
      </div>
    </div>
  );
};

export default HorizontalCard;
