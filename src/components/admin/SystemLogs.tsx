
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Activity, AlertCircle } from "lucide-react"

export const SystemLogs = () => {
  const logs = [
    { id: 1, type: "error", message: "Failed to connect to SAM.gov API", timestamp: "2024-02-20 14:30:00" },
    { id: 2, type: "warning", message: "Rate limit reached for Upwork API", timestamp: "2024-02-20 14:25:00" },
    { id: 3, type: "info", message: "Successfully synchronized 150 new contracts", timestamp: "2024-02-20 14:20:00" },
    { id: 4, type: "error", message: "Database connection timeout", timestamp: "2024-02-20 14:15:00" },
  ]

  const getAlertVariant = (type: string) => {
    if (type === "error") return "destructive"
    return "default"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {logs.map((log) => (
              <Alert key={log.id} variant={getAlertVariant(log.type)}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  {log.type.toUpperCase()}
                  <span className="text-sm font-normal">{log.timestamp}</span>
                </AlertTitle>
                <AlertDescription>
                  {log.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
