import Subjects from "./components/Subjects/Subjects";
import UpcomingExam from "./components/UpcomingExam/UpcomingExam";
import CombineBanners from "./components/DashboardBanners/CombineBanners";
import StudyStats from "./components/StudyStats/StudyStats";
import StudyStreak from "./components/StudyStreak/StudyStreak";
import TodaysFocus from "./components/TodaysFocus/TodaysFocus";

function DashboardPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 md:mb-8 lg:mb-10">
        <CombineBanners />
      </div>

      {/* Study Stats Overview */}
      <div className="mt-8 md:mt-10 lg:mt-12">
        <StudyStats />
      </div>

      {/* Streak and Today's Focus Grid */}
      <div className="mt-8 md:mt-10 lg:mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudyStreak />
        <TodaysFocus />
      </div>

      {/* Subjects section */}
      <div className="mt-8 md:mt-10 lg:mt-12">
        <Subjects />
      </div>

      {/* Upcoming Exam Section */}
      <div className="mt-8 md:mt-10 lg:mt-12">
        <UpcomingExam />
      </div>
    </div>
  );
}

export default DashboardPage;
