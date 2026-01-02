import Subjects from "./components/Subjects/Subjects";
import UpcomingExam from "./components/UpcomingExam/UpcomingExam";
import CombineBanners from "./components/DashboardBanners/CombineBanners";

function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-10">
        <CombineBanners />
      </div>
      {/* Subjects section */}
      <div className="mt-12">
        <Subjects />
      </div>
      {/* Upcoming Exam Section */}
      <div className="mt-12">
        <UpcomingExam />
      </div>
    </div>
  );
}

export default DashboardPage;
