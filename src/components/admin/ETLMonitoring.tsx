
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Database } from "lucide-react"

export const ETLMonitoring = () => {
  const sources = [
    { name: "SAM.gov", status: "active", progress: 85, lastSync: "10 mins ago" },
    { name: "Upwork", status: "active", progress: 92, lastSync: "5 mins ago" },
    { name: "Fiverr", status: "warning", progress: 45, lastSync: "1 hour ago" },
    { name: "Freelancer", status: "error", progress: 0, lastSync: "3 hours ago" }
  ]

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "warning":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "default"
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Sources Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sources.map((source) => (
              <div key={source.name} className="flex items-center gap-4">
                <div className="w-24">{source.name}</div>
                <Progress value={source.progress} className="flex-1" />
                <Badge variant={getBadgeVariant(source.status)}>
                  {source.status}
                </Badge>
                <div className="text-sm text-muted-foreground w-24 text-right">
                  {source.lastSync}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
