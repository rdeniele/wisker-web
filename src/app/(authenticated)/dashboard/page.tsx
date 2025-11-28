
import React from 'react';
import NavBar from '@/components/Navbar/NavBar';
import CombineBanners from './components/DashboardBanners/CombineBanners';
import SubjectHistory from './components/SubjectHistory/SubjectHistory';

function DashboardPage() {
  return (
    <>
      <NavBar />
      <div className="p-6">
        <div className="mb-10">
          <CombineBanners />
        </div>
        {/* New section for subject history */}
        <div className="mt-12">
          <SubjectHistory />
        </div>
      </div>
    </>
  );
}

export default DashboardPage;