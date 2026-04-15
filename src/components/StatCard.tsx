import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
  accentColor?: string;
}

const ACCENT_COLORS = [
  { bg: "from-[hsl(245,75%,58%)] to-[hsl(265,70%,56%)]", shadow: "shadow-[hsl(245,75%,58%)]/25", ring: "ring-[hsl(245,75%,58%)]/10" },
  { bg: "from-[hsl(280,60%,55%)] to-[hsl(300,55%,50%)]", shadow: "shadow-[hsl(280,60%,55%)]/25", ring: "ring-[hsl(280,60%,55%)]/10" },
  { bg: "from-[hsl(210,80%,56%)] to-[hsl(230,70%,56%)]", shadow: "shadow-[hsl(210,80%,56%)]/25", ring: "ring-[hsl(210,80%,56%)]/10" },
  { bg: "from-[hsl(152,60%,40%)] to-[hsl(170,55%,42%)]", shadow: "shadow-[hsl(152,60%,40%)]/25", ring: "ring-[hsl(152,60%,40%)]/10" },
  { bg: "from-[hsl(38,92%,50%)] to-[hsl(28,85%,52%)]", shadow: "shadow-[hsl(38,92%,50%)]/25", ring: "ring-[hsl(38,92%,50%)]/10" },
  { bg: "from-[hsl(0,72%,51%)] to-[hsl(350,65%,50%)]", shadow: "shadow-[hsl(0,72%,51%)]/25", ring: "ring-[hsl(0,72%,51%)]/10" },
];

const StatCard = ({ title, value, subtitle, icon: Icon, trend, className = "", accentColor }: StatCardProps) => {
  // Pick a color based on title hash for variety
  const colorIndex = title.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % ACCENT_COLORS.length;
  const color = ACCENT_COLORS[colorIndex];

  return (
    <Card className={`group relative overflow-hidden border border-border/30 bg-card shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-400 rounded-2xl card-shine card-glow ${className}`}>
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color.bg} opacity-80`} />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">{title}</p>
            <p className="text-3xl font-black tracking-tight text-foreground leading-none">{value}</p>
            {subtitle && (
              <p className={`text-[10px] font-semibold ${trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground/70"}`}>
                {subtitle}
              </p>
            )}
          </div>
          <div className={`rounded-2xl bg-gradient-to-br ${color.bg} p-2.5 shadow-lg ${color.shadow} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
