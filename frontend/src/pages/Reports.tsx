// frontend/src/pages/ReportsPage.tsx
import SideBar from "@/components/layout/SideBar";
import ReportsList from "@/components/reports/ReportsList";

export default function ReportsPage({ mode = "ongoing" }: { mode?: "ongoing" | "submitted" }) {
  return (
    <div className="h-screen bg-gray-50 flex">
      <SideBar />
      <main className="flex-1 p-4 md:p-6">
        <ReportsList />
      </main>
    </div>
  );
}
