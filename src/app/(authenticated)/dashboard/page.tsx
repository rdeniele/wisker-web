


import NavBar from '@/components/Navbar/NavBar';
import AddSubject from './components/QuickAction/AddSubject';
import ClaimReward from './components/QuickAction/ClaimReward';
import CreateFlasCard from './components/QuickAction/CreateFlasCard';
import ProgressProfile from './components/QuickAction/ProgressProfile';
import Subjects from './components/Subjects/Subjects';
import UpcomingExam from './components/UpcomingExam/UpcomingExam';
import CombineBanners from './components/DashboardBanners/CombineBanners';
import NoteHistory from './components/SubjectHistory/NoteHistory';
import RecentActivity from './components/RecentActivity/RecentAcitivty';

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
              className="text-3xl font-extrabold mb-0 leading-none text-[#231F20]"
              style={{ fontFamily: 'Fredoka, Arial, sans-serif' }}
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
        {/* Upcoming Exam Section */}
        <div className="mt-12">
          <UpcomingExam />
        </div>
        <div className="mt-12">
          <RecentActivity />
        </div>
        </div>
      </div>
    </>
  );
}

export default DashboardPage;