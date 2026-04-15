import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { SITE_NAMES, type Site, type SiteMetrics } from "@/data/skillData";
import { TrendingUp } from "lucide-react";

interface Props {
  selectedSites: Site[];
  siteMetrics: SiteMetrics[];
}

const CTIBarChart = ({ selectedSites, siteMetrics }: Props) => {
  const data = useMemo(() =>
    siteMetrics
      .filter((s) => selectedSites.includes(s.site) && s.directCTI > 0)
      .map((s) => ({
        site: SITE_NAMES[s.site],
        "Direct CTI": s.directCTI,
        "Indirect CTI": s.indirectCTI,
      })),
    [selectedSites, siteMetrics]
  );

  return (
    <Card className="chart-card border-0 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-gradient-to-br from-[hsl(245,75%,58%)] to-[hsl(265,70%,56%)] p-2 shadow-md shadow-primary/20">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <CardTitle className="text-base font-bold text-foreground">CT Index by Site</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={data} barGap={6} barCategoryGap="20%">
            <defs>
              <linearGradient id="directGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(245 75% 58%)" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(245 75% 65%)" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="indirectGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(280 60% 55%)" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(280 60% 62%)" stopOpacity={0.8} />
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
            <Bar dataKey="Direct CTI" fill="url(#directGrad)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Indirect CTI" fill="url(#indirectGrad)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default CTIBarChart;
