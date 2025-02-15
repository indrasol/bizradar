import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Clock, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const jobs = [
  {
    id: "fl-1",
    title: "Machine Learning Engineer for NLP Project",
    platform: "Upwork",
    budget: "10000-15000",
    duration: "3 months",
    skills: ["Python", "NLP", "TensorFlow"],
    status: "Open",
  },
  {
    id: "fl-2",
    title: "Data Pipeline Development",
    platform: "Fiverr",
    budget: "5000-8000",
    duration: "2 months",
    skills: ["ETL", "Python", "SQL"],
    status: "Open",
  },
];

export const FreelanceJobs = () => {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 my-4">
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upwork">Upwork</SelectItem>
            <SelectItem value="fiverr">Fiverr</SelectItem>
            <SelectItem value="freelancer">Freelancer</SelectItem>
            <SelectItem value="all">All Platforms</SelectItem>
          </SelectContent>
        </Select>
        
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Budget Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-5000">$0 - $5,000</SelectItem>
            <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
            <SelectItem value="10000+">$10,000+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {jobs.map((job) => (
          <Link key={job.id} to={`/contracts/${job.id}`}>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Globe className="w-4 h-4 mr-1" />
                    {job.platform}
                  </div>
                </div>
                <Badge>{job.status}</Badge>
              </div>
              
              <div className="mt-4 flex gap-4">
                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="w-4 h-4 mr-1" />
                  ${job.budget}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {job.duration}
                </div>
              </div>
              
              <div className="mt-3 flex gap-2">
                {job.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};