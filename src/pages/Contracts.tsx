import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GovernmentContracts } from "@/components/contracts/GovernmentContracts";
import { FreelanceJobs } from "@/components/contracts/FreelanceJobs";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const Contracts = () => {
  return (
    <DashboardLayout>
      <div className="space-y-4 p-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Contracts & Jobs</h1>
        </div>
        
        <Tabs defaultValue="government" className="w-full">
          <TabsList>
            <TabsTrigger value="government">Government Contracts</TabsTrigger>
            <TabsTrigger value="freelance">Freelance Jobs</TabsTrigger>
          </TabsList>
          <TabsContent value="government">
            <GovernmentContracts />
          </TabsContent>
          <TabsContent value="freelance">
            <FreelanceJobs />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Contracts;