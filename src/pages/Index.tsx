import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ContractsList } from "@/components/dashboard/ContractsList";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { DollarSign, Briefcase, Users, TrendingUp } from "lucide-react";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Opportunities"
          value="1,234"
          icon={Briefcase}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Proposals"
          value="45"
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Success Rate"
          value="68%"
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Total Value"
          value="$2.4M"
          icon={DollarSign}
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
          <div className="mt-6">
            <ContractsList />
          </div>
        </div>
        <div>
          <ActivityTimeline />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;