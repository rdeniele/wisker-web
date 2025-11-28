
import React from 'react';
import NavBar from '@/components/Navbar/NavBar';
import FreeTrialBanner from './components/DashboardBanners/FreeTrialBanner';
import LearnMoreBanner from './components/DashboardBanners/LearnMoreBanner';

function DashboardPage() {
  return (
    <>
      <NavBar />
      <div className="p-6">
        <div className="space-y-6">
          <FreeTrialBanner />
          <LearnMoreBanner />
        </div>
      </div>
    </>
  );
}

export default DashboardPage;