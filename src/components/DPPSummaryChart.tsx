import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { SITE_NAMES, type Site } from "@/data/skillData";
import { filterEmployees } from "@/lib/employee-utils";
import type { Employee } from "@/data/employeeData";
import { Award } from "lucide-react";

interface Props {
  selectedSites: Site[];
  allEmployees: Employee[];
}

const DPPSummaryChart = ({ selectedSites, allEmployees }: Props) => {
  const data = useMemo(() => {
    return selectedSites.map((site) => {
      const siteEmployees = filterEmployees(allEmployees, { sites: [site] });
      const counts = { "DPP 0": 0, "DPP 1": 0, "DPP 2": 0, "DPP 3": 0 };
      siteEmployees.forEach((e) => {
        const key = `DPP ${e.directDPP}` as keyof typeof counts;
        if (key in counts) counts[key] += 1;
      });
      return { site: SITE_NAMES[site], ...counts };
    });
  }, [selectedSites, allEmployees]);

  return (
    <Card className="chart-card border-0 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-gradient-to-br from-[hsl(280,60%,55%)] to-[hsl(300,55%,50%)] p-2 shadow-md shadow-accent/20">
            <Award className="h-4 w-4 text-primary-foreground" />
          </div>
          <CardTitle className="text-base font-bold text-foreground">DPP Distribution by Site</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={data} barCategoryGap="20%">
            <defs>
              <linearGradient id="dpp0Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0 72% 51%)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(0 72% 60%)" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="dpp1Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(38 92% 50%)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(38 92% 58%)" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="dpp2Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(210 80% 56%)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(210 80% 64%)" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="dpp3Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(152 60% 40%)" stopOpacity={0.95} />
                <stop offset="100%" stopColor="hsl(152 60% 48%)" stopOpacity={0.75} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 20% 93%)" vertical={false} />
            <XAxis dataKey="site" tick={{ fontSize: 11, fill: "hsl(230 15% 46%)", fontWeight: 500 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={55} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(230 15% 46%)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(230 20% 91%)", borderRadius: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.1)", padding: "12px 16px" }}
              cursor={{ fill: "hsl(245 75% 58% / 0.04)" }}
              labelStyle={{ fontWeight: 700, marginBottom: 4 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, fontWeight: 500 }} />
            <Bar dataKey="DPP 0" stackId="a" fill="url(#dpp0Grad)" />
            <Bar dataKey="DPP 1" stackId="a" fill="url(#dpp1Grad)" />
            <Bar dataKey="DPP 2" stackId="a" fill="url(#dpp2Grad)" />
            <Bar dataKey="DPP 3" stackId="a" fill="url(#dpp3Grad)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DPPSummaryChart;
