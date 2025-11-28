

import NavBar from '@/components/Navbar/NavBar';
import ProgressProfile from './components/QuickAction/ProgressProfile';
import CombineBanners from './components/DashboardBanners/CombineBanners';
import Subjects from './components/Subjects/Subjects';
import NoteHistory from './components/SubjectHistory/NoteHistory';
import ClaimReward from './components/QuickAction/ClaimReward';
import CreateFlasCard from './components/QuickAction/CreateFlasCard';
import AddSubject from './components/QuickAction/AddSubject';

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
          <NoteHistory />
        </div>

        {/* Quick Action Section */}
        <div className="mt-16">
          <div className="mb-6">
            <h1
              className="text-[30px] font-black mb-0 leading-none"
              style={{ fontFamily: 'Montserrat, Arial, sans-serif', color: '#231F20' }}
            >
              Quick Action
            </h1>
          </div>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center"
          >
            <ClaimReward />
            <ProgressProfile />
            <CreateFlasCard />
            <AddSubject />
          </div>
          {/* Subjects section */}
        <div className="mt-12">
          <Subjects />
        </div>
        </div>
      </div>
    </>
  );
}

export default DashboardPage;