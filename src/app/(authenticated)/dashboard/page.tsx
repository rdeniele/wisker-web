import Subjects from "./components/Subjects/Subjects";
import UpcomingExam from "./components/UpcomingExam/UpcomingExam";
import CombineBanners from "./components/DashboardBanners/CombineBanners";
import NoteHistory from "./components/SubjectHistory/NoteHistory";
import RecentActivity from "./components/RecentActivity/RecentAcitivty";

function DashboardPage() {
  return (
    <div className="p-6">
          <div className="mb-10">
            <CombineBanners />
          </div>
          {/* New section for subject history */}
          <div className="mt-12">
            <NoteHistory />
          </div>
          <div className="mt-16">
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
  );
}

export default DashboardPage;
