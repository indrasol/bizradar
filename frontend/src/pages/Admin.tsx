import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Users, Database, Activity } from "lucide-react"
import { ETLMonitoring } from "@/components/admin/ETLMonitoring"
import { UserManagement } from "@/components/admin/UserManagement"
import { SystemLogs } from "@/components/admin/SystemLogs"

const Admin = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <Tabs defaultValue="etl" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="etl">ETL Monitoring</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="etl">
          <ETLMonitoring />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="logs">
          <SystemLogs />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Admin