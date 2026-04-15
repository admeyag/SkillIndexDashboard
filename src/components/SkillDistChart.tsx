import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { SITE_NAMES, type Site } from "@/data/skillData";
import { filterEmployees } from "@/lib/employee-utils";
import type { Employee } from "@/data/employeeData";
import { Percent } from "lucide-react";

interface Props {
  selectedSites: Site[];
  allEmployees: Employee[];
}

const SkillDistChart = ({ selectedSites, allEmployees }: Props) => {
  const data = useMemo(() => {
    return selectedSites.map((site) => {
      const siteEmployees = filterEmployees(allEmployees, { sites: [site] }).filter((e) => e.skillPct);
      const buckets = { "0-25%": 0, "26-50%": 0, "51-75%": 0, "76-100%": 0 };
      siteEmployees.forEach((e) => {
        const pct = parseInt(e.skillPct, 10);
        if (Number.isNaN(pct)) return;
        if (pct <= 25) buckets["0-25%"] += 1;
        else if (pct <= 50) buckets["26-50%"] += 1;
        else if (pct <= 75) buckets["51-75%"] += 1;
        else buckets["76-100%"] += 1;
      });
      return { site: SITE_NAMES[site], ...buckets };
    });
  }, [selectedSites, allEmployees]);

  return (
    <Card className="chart-card border-0 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-gradient-to-br from-[hsl(210,80%,56%)] to-[hsl(230,70%,56%)] p-2 shadow-md shadow-info/20">
            <Percent className="h-4 w-4 text-primary-foreground" />
          </div>
          <CardTitle className="text-base font-bold text-foreground">Skill % Distribution by Site</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={data} barCategoryGap="20%">
            <defs>
              <linearGradient id="skill0Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0 72% 51%)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(0 72% 60%)" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="skill25Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(38 92% 50%)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(38 92% 58%)" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="skill50Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(210 80% 56%)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(210 80% 64%)" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="skill75Grad" x1="0" y1="0" x2="0" y2="1">
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
            <Bar dataKey="0-25%" stackId="a" fill="url(#skill0Grad)" />
            <Bar dataKey="26-50%" stackId="a" fill="url(#skill25Grad)" />
            <Bar dataKey="51-75%" stackId="a" fill="url(#skill50Grad)" />
            <Bar dataKey="76-100%" stackId="a" fill="url(#skill75Grad)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SkillDistChart;
