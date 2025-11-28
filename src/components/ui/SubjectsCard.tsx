import React from 'react';
import Image from 'next/image';

interface SubjectsCardProps {
  imageSrc: string;
  subjectName: string;
  quizInDays: number;
  notesCount: number;
  createdSecondsAgo: number;
}

function formatTimeAgo(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const SubjectsCard: React.FC<SubjectsCardProps> = ({
  imageSrc,
  subjectName,
  quizInDays,
  notesCount,
  createdSecondsAgo,
}) => {
  return (
    <div className="rounded-2xl bg-white shadow-[0_4px_0_0_rgba(91,91,255,0.08)] p-5 w-[220px] min-h-[220px] flex flex-col justify-between items-start relative border border-[#F3F3F3]">
      <div className="flex items-center mb-2">
        <div className="bg-[#5B5BFF] rounded-xl p-2 flex items-center justify-center" style={{ width: 48, height: 48 }}>
          <Image src={imageSrc} alt={subjectName} width={32} height={32} />
        </div>
      </div>
      <div className="mt-2">
        <div className="font-fredoka font-bold text-xl text-gray-900 mb-1">{subjectName}</div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
          <span className="text-gray-700 text-base font-medium">Quiz in {quizInDays} days</span>
        </div>
      </div>
      <div className="text-gray-400 text-sm font-medium mt-4">
        {notesCount} Notes created &bull; {formatTimeAgo(createdSecondsAgo)}
      </div>
    </div>
  );
};

export default SubjectsCard;