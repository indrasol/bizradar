import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", value: 1000 },
  { month: "Feb", value: 2000 },
  { month: "Mar", value: 1500 },
  { month: "Apr", value: 3000 },
  { month: "May", value: 2500 },
  { month: "Jun", value: 4000 },
];

export const RevenueChart = () => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Contract Value Trends</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};