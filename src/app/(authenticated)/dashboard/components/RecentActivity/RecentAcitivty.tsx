import React from 'react';
import HorizontalCard from '@/components/ui/HorizontalCard';

const activities = [
  {
    title: 'Uploaded PDF',
    image: '/images/ui/clock.png',
    day: '',
    date: 'August 30, 2025',
  },
  {
    title: 'Quiz Taken',
    image: '/images/ui/clock.png',
    day: '',
    date: 'August 30, 2025',
  },
  {
    title: 'Created Notes',
    image: '/images/ui/clock.png',
    day: '',
    date: 'August 30, 2025',
  },
];

function RecentActivity() {
  return (
    <div className="w-full mb-12">
      <h1
        className="text-3xl font-extrabold text-gray-900 mb-6"
        style={{ fontFamily: 'Fredoka, Arial, sans-serif' }}
      >
        Recent Activity
      </h1>
      <div className="space-y-6">
        {activities.map((activity, idx) => (
          <HorizontalCard
            key={idx}
            title={activity.title}
            image={activity.image}
            day={activity.day}
            date={activity.date}
          />
        ))}
      </div>
    </div>
  );
}

export default RecentActivity;