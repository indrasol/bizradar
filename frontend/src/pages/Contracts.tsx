
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GovernmentContracts } from "@/components/contracts/GovernmentContracts";
import { FreelanceJobs } from "@/components/contracts/FreelanceJobs";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SearchBar } from "@/components/dashboard/SearchBar";

const Contracts = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="bg-white py-12 border-b">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Discover Business Opportunities</h1>
            <div className="max-w-xl mx-auto">
              <SearchBar 
                selectionType="default" 
                platform="web" 
                onSearchResults={(results) => console.log(results)} 
              />
            </div>
          </div>
        </div>
        
        <div className="p-8">
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
      </div>
    </DashboardLayout>
  );
};

export default Contracts;
