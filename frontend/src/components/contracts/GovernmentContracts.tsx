
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Calendar, Building2, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const contracts = [
  {
    id: "gov-1",
    title: "Cybersecurity Infrastructure Upgrade",
    agency: "Department of Defense",
    platform: "SAM.gov",
    value: 2500000,
    dueDate: "2024-04-15",
    status: "Open",
    naicsCode: "541512",
  },
  {
    id: "gov-2",
    title: "AI-Powered Data Analytics Platform",
    agency: "Department of Energy",
    platform: "GovWin",
    value: 1800000,
    dueDate: "2024-04-20",
    status: "Open",
    naicsCode: "541511",
  },
  {
    id: "gov-3",
    title: "AI-Powered Data Platform",
    agency: "Department of Energy",
    platform: "GovWin",
    value: 180002,
    dueDate: "2024-04-20",
    status: "Open",
    naicsCode: "541511",
  },
];

export const GovernmentContracts = () => {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 my-4">
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Agency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dod">Department of Defense</SelectItem>
            <SelectItem value="doe">Department of Energy</SelectItem>
            <SelectItem value="all">All Agencies</SelectItem>
          </SelectContent>
        </Select>
        
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sam">SAM.gov</SelectItem>
            <SelectItem value="govwin">GovWin</SelectItem>
            <SelectItem value="all">All Platforms</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {contracts.map((contract) => (
          <Link key={contract.id} to={`/contracts/${contract.id}`}>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{contract.title}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Building2 className="w-4 h-4 mr-1" />
                    {contract.agency}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={(e) => {
                      e.preventDefault();
                      // Add RFP generation logic here
                      console.log("Generate RFP for:", contract.id);
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    Generate RFP
                  </Button>
                  <Badge>{contract.status}</Badge>
                </div>
              </div>
              
              <div className="mt-4 flex gap-4">
                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="w-4 h-4 mr-1" />
                  ${contract.value.toLocaleString()}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  Due: {new Date(contract.dueDate).toLocaleDateString()}
                </div>
                <Badge variant="outline">{contract.naicsCode}</Badge>
                <Badge variant="secondary">{contract.platform}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
