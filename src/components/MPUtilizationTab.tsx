import { useState, useMemo } from "react";
import { format, parse, subDays } from "date-fns";
import { CalendarIcon, RefreshCw, Loader2, ArrowLeft, TrendingUp, TrendingDown, Activity, Filter, X } from "lucide-react";
import { useMPUtilization, PROCESS_NAMES, type SiteDailyBreakup } from "@/hooks/use-mp-utilization";
import { SITE_NAMES, type Site } from "@/data/skillData";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, ReferenceLine, Cell } from "recharts";
import { Checkbox } from "@/components/ui/checkbox";

function parseRawDate(raw: string): Date | null {
  try {
    const d = parse(raw, "dd-MMM-yyyy", new Date());
    if (!isNaN(d.getTime())) return d;
  } catch { /* ignore */ }
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
  } catch { /* ignore */ }
  return null;
}

const SITE_COLORS: Record<string, string> = {
  MUM: "#6366f1", GGN: "#ec4899", BLR: "#f59e0b", CCU: "#10b981",
  GAU: "#8b5cf6", LKO: "#ef4444", MAA: "#06b6d4", HYD: "#f97316",
  COK: "#14b8a6", VGA: "#a855f7", CJB: "#3b82f6", PAT: "#84cc16", BBI: "#e11d48",
};

const getUtilColor = (val: number) => val >= 100 ? "text-emerald-600" : "text-red-500";
const getUtilBg = (val: number) => val >= 100 ? "from-emerald-500 to-teal-500" : "from-red-500 to-rose-500";
const getUtilIcon = (val: number) =>
  val >= 100 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />;

/* ─── Date Range Picker ─── */
const DateRangePicker = ({
  startDate, endDate, onStartChange, onEndChange, enabledDateStrings,
}: {
  startDate: Date | undefined; endDate: Date | undefined;
  onStartChange: (d: Date | undefined) => void; onEndChange: (d: Date | undefined) => void;
  enabledDateStrings: Set<string>;
}) => (
  <div className="flex items-center gap-2 flex-wrap">
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-[150px] justify-start text-left font-normal rounded-full border-info/20 hover:border-info/40 hover:bg-info/5 transition-colors">
          <CalendarIcon className="mr-2 h-3.5 w-3.5 text-info" />
          {startDate ? format(startDate, "dd MMM yyyy") : "Start date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={startDate} onSelect={onStartChange}
          disabled={(date) => !enabledDateStrings.has(date.toDateString())}
          initialFocus className={cn("p-3 pointer-events-auto")} />
      </PopoverContent>
    </Popover>
    <span className="text-xs text-muted-foreground font-medium">→</span>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-[150px] justify-start text-left font-normal rounded-full border-info/20 hover:border-info/40 hover:bg-info/5 transition-colors">
          <CalendarIcon className="mr-2 h-3.5 w-3.5 text-info" />
          {endDate ? format(endDate, "dd MMM yyyy") : "End date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={endDate} onSelect={onEndChange}
          disabled={(date) => !enabledDateStrings.has(date.toDateString())}
          initialFocus className={cn("p-3 pointer-events-auto")} />
      </PopoverContent>
    </Popover>
  </div>
);

/* ─── Multi-select Filter Dropdown ─── */
const FilterDropdown = ({
  label, options, selected, onToggle, onClear, getLabel,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  onClear: () => void;
  getLabel?: (val: string) => string;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" size="sm" className="rounded-full border-info/20 hover:border-info/40 hover:bg-info/5 transition-colors gap-1.5 text-xs">
        <Filter className="h-3 w-3 text-info" />
        {label}
        {selected.length > 0 && (
          <span className="bg-info/15 text-info px-1.5 py-0.5 rounded-full text-[10px] font-bold ml-0.5">{selected.length}</span>
        )}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-56 p-2 max-h-72 overflow-y-auto" align="start">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        {selected.length > 0 && (
          <button onClick={onClear} className="text-[10px] text-info hover:underline font-medium">Clear all</button>
        )}
      </div>
      <div className="space-y-0.5">
        {options.map((opt) => (
          <button key={opt} onClick={() => onToggle(opt)}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors text-left">
            <Checkbox checked={selected.includes(opt)} className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{getLabel ? getLabel(opt) : opt}</span>
          </button>
        ))}
      </div>
    </PopoverContent>
  </Popover>
);

/* ─── Custom Bar Shape with rounded gradient ─── */
const GradientBar = (props: any) => {
  const { x, y, width, height, value } = props;
  const fill = value >= 100 ? "url(#greenGradient)" : "url(#redGradient)";
  return <rect x={x} y={y} width={width} height={height} rx={6} ry={6} fill={fill} />;
};

/* ─── Main Component ─── */
const MPUtilizationTab = () => {
  const { allSiteData, availableDates, loading, lastUpdated, refresh, getUtilizationForDate, getBreakupForSiteDate } = useMPUtilization();
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [trendStart, setTrendStart] = useState<Date | undefined>(undefined);
  const [trendEnd, setTrendEnd] = useState<Date | undefined>(undefined);
  const [trendSiteFilter, setTrendSiteFilter] = useState<string[]>([]);
  const [trendProcessFilter, setTrendProcessFilter] = useState<string[]>([]);

  const allSiteCodes = useMemo(() => Object.keys(allSiteData), [allSiteData]);

  // Available processes across all data
  const availableProcesses = useMemo(() => {
    const procs = new Set<string>();
    for (const breakups of Object.values(allSiteData)) {
      for (const b of breakups) {
        for (const p of b.processes) {
          if (p.projected !== "0" || p.actual !== "0" || p.received !== "0") {
            procs.add(p.process);
          }
        }
      }
    }
    return PROCESS_NAMES.filter((p) => procs.has(p));
  }, [allSiteData]);

  const toggleSiteFilter = (code: string) => {
    setTrendSiteFilter((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);
  };
  const toggleProcessFilter = (proc: string) => {
    setTrendProcessFilter((prev) => prev.includes(proc) ? prev.filter((p) => p !== proc) : [...prev, proc]);
  };

  const parsedDates = useMemo(() =>
    availableDates.map((raw) => ({ raw, date: parseRawDate(raw) }))
      .filter((d) => d.date !== null) as { raw: string; date: Date }[],
    [availableDates]
  );

  const enabledDateStrings = useMemo(
    () => new Set(parsedDates.map((d) => d.date.toDateString())),
    [parsedDates]
  );

  const activeRawDate = useMemo(() => {
    const target = selectedDate || parsedDates[0]?.date;
    if (!target) return null;
    const match = parsedDates.find((d) => d.date.toDateString() === target.toDateString());
    return match?.raw || null;
  }, [selectedDate, parsedDates]);

  const filteredSummary = useMemo(
    () => (activeRawDate ? getUtilizationForDate(activeRawDate) : []),
    [activeRawDate, getUtilizationForDate]
  );

  const chartData = useMemo(
    () => filteredSummary.map((s) => ({
      site: SITE_NAMES[s.siteCode as Site] || s.siteCode,
      siteCode: s.siteCode,
      utilization: s.utilization,
    })),
    [filteredSummary]
  );

  const avgUtil = filteredSummary.length
    ? (filteredSummary.reduce((s, d) => s + d.utilization, 0) / filteredSummary.length).toFixed(1)
    : "—";

  const aboveCount = filteredSummary.filter(s => s.utilization >= 100).length;
  const belowCount = filteredSummary.filter(s => s.utilization < 100).length;

  // ── Trend data with date range ──
  const trendRange = useMemo(() => {
    if (!parsedDates.length) return { start: undefined, end: undefined, dates: [] as typeof parsedDates };
    const end = trendEnd || parsedDates[0]?.date;
    const start = trendStart || (end ? subDays(end, 6) : undefined);
    if (!start || !end) return { start, end, dates: [] as typeof parsedDates };

    const filtered = parsedDates
      .filter((d) => d.date >= start && d.date <= end)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return { start, end, dates: filtered };
  }, [parsedDates, trendStart, trendEnd]);

  // Effective site codes for trend (filtered or all)
  const effectiveTrendSites = useMemo(
    () => trendSiteFilter.length > 0 ? trendSiteFilter : allSiteCodes,
    [trendSiteFilter, allSiteCodes]
  );

  // Compute utilization for a site on a date, optionally filtered by processes
  const getFilteredUtil = useMemo(() => {
    return (siteCode: string, rawDate: string): number | undefined => {
      if (trendProcessFilter.length === 0) {
        // No process filter — use overall site utilization
        const u = getUtilizationForDate(rawDate).find((x) => x.siteCode === siteCode);
        return u?.utilization;
      }
      // Process filter active — compute avg of selected processes
      const breakup = getBreakupForSiteDate(siteCode, rawDate);
      if (!breakup) return undefined;
      const procs = breakup.processes.filter((p) => trendProcessFilter.includes(p.process));
      if (procs.length === 0) return undefined;
      const total = procs.reduce((sum, p) => sum + (parseFloat(p.percentage.replace("%", "")) || 0), 0);
      return parseFloat((total / procs.length).toFixed(1));
    };
  }, [trendProcessFilter, getUtilizationForDate, getBreakupForSiteDate]);

  const siteAverages = useMemo(() => {
    if (!trendRange.dates.length) return [];
    const siteMap: Record<string, { total: number; count: number }> = {};
    for (const d of trendRange.dates) {
      for (const code of effectiveTrendSites) {
        const val = getFilteredUtil(code, d.raw);
        if (val === undefined) continue;
        if (!siteMap[code]) siteMap[code] = { total: 0, count: 0 };
        siteMap[code].total += val;
        siteMap[code].count += 1;
      }
    }
    return Object.entries(siteMap)
      .map(([code, { total, count }]) => ({
        site: SITE_NAMES[code as Site] || code,
        siteCode: code,
        avg: parseFloat((total / count).toFixed(1)),
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [trendRange.dates, effectiveTrendSites, getFilteredUtil]);

  const dailyTrendData = useMemo(() => {
    return trendRange.dates.map((d) => {
      const entry: Record<string, any> = { date: format(d.date, "dd MMM") };
      for (const code of effectiveTrendSites) {
        const val = getFilteredUtil(code, d.raw);
        if (val !== undefined) entry[code] = val;
      }
      return entry;
    });
  }, [trendRange.dates, effectiveTrendSites, getFilteredUtil]);

  const trendSiteCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const row of dailyTrendData) {
      for (const key of Object.keys(row)) {
        if (key !== "date") codes.add(key);
      }
    }
    return Array.from(codes);
  }, [dailyTrendData]);

  // Active filter labels
  const activeFilterCount = trendSiteFilter.length + trendProcessFilter.length;

  // ── Site breakup detail ──
  if (selectedSite && activeRawDate) {
    const siteName = SITE_NAMES[selectedSite as Site] || selectedSite;
    const dayData = getBreakupForSiteDate(selectedSite, activeRawDate);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setSelectedSite(null)} className="gap-1.5 rounded-full border-info/20 hover:bg-info/5 hover:text-info hover:border-info/40 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <h2 className="text-lg font-bold gradient-text-mp">{siteName} — Process Breakup</h2>
          <span className="text-xs text-muted-foreground bg-muted/80 px-3 py-1 rounded-full font-medium">{activeRawDate}</span>
        </div>
        {!dayData ? (
          <Card className="border border-border/50 shadow-lg"><CardContent className="py-12 text-center text-muted-foreground">No process data available for this date</CardContent></Card>
        ) : (
          <Card className="border border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-info/5 to-transparent">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-bold">{dayData.date}</CardTitle>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>LM vs Actual: <strong className={`text-sm ${getUtilColor(parseFloat(dayData.lmVsActual))}`}>{dayData.lmVsActual}</strong></span>
                  <span>DPP Util: <strong className="text-foreground">{dayData.dppUtilization}</strong></span>
                  <span>Present: <strong className="text-foreground">{dayData.presentCount}</strong></span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs bg-muted/30">
                      <TableHead className="font-bold">Process</TableHead>
                      <TableHead className="text-right">Projected</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead className="text-right">Gap</TableHead>
                      <TableHead className="text-right">Loss Hrs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dayData.processes
                      .filter((p) => p.projected !== "0" || p.actual !== "0" || p.received !== "0")
                      .map((p) => (
                        <TableRow key={p.process} className="text-xs hover:bg-muted/20 transition-colors">
                          <TableCell className="font-semibold">{p.process}</TableCell>
                          <TableCell className="text-right">{p.projected}</TableCell>
                          <TableCell className="text-right">{p.received}</TableCell>
                          <TableCell className="text-right">{p.actual}</TableCell>
                          <TableCell className={`text-right font-bold ${getUtilColor(parseFloat(p.percentage))}`}>{p.percentage}</TableCell>
                          <TableCell className="text-right">{p.gap}</TableCell>
                          <TableCell className="text-right">{p.lossHrs}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal rounded-full border-info/20 hover:border-info/40 hover:bg-info/5 transition-colors", !activeRawDate && "text-muted-foreground")} size="sm">
                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-info" />
                {activeRawDate || "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={selectedDate || parsedDates[0]?.date || undefined} onSelect={setSelectedDate}
                disabled={(date) => !enabledDateStrings.has(date.toDateString())} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          {lastUpdated && <span className="text-[10px] text-muted-foreground font-medium">Updated {lastUpdated.toLocaleTimeString()}</span>}
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="gap-1.5 rounded-full border-info/20 hover:bg-info/5 hover:text-info hover:border-info/40 transition-colors">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full gradient-bg-mp opacity-20 blur-xl animate-pulse" />
            <Loader2 className="h-10 w-10 animate-spin text-info relative" />
          </div>
          <p className="text-muted-foreground font-medium">Loading data…</p>
        </div>
      ) : (
        <>
          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border border-border/50 shadow-lg overflow-hidden group hover:-translate-y-0.5 transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-info to-primary opacity-60" />
              <CardContent className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Avg Utilization</p>
                <p className={`text-3xl font-black mt-1 ${getUtilColor(parseFloat(avgUtil) || 0)}`}>{avgUtil}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">All sites • {activeRawDate}</p>
              </CardContent>
            </Card>
            <Card className="border border-border/50 shadow-lg overflow-hidden group hover:-translate-y-0.5 transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60" />
              <CardContent className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Above Target</p>
                <p className="text-3xl font-black mt-1 text-emerald-600">{aboveCount}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Sites ≥ 100%</p>
              </CardContent>
            </Card>
            <Card className="border border-border/50 shadow-lg overflow-hidden group hover:-translate-y-0.5 transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 to-rose-500 opacity-60" />
              <CardContent className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Below Target</p>
                <p className="text-3xl font-black mt-1 text-red-500">{belowCount}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Sites &lt; 100%</p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Bar chart */}
          <Card className="border border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-info/5 to-transparent">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-info" />
                <CardTitle className="text-base font-bold">Site Utilization — {activeRawDate || "No data"}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} barGap={4}>
                  <defs>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                    <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#f87171" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="site" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 140]} unit="%" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.1)" }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Utilization"]} />
                  <ReferenceLine y={100} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "Target", position: "right", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Bar dataKey="utilization" shape={<GradientBar />}
                    label={({ x, y, width, value }: any) => (
                      <text x={x + width / 2} y={y - 8} textAnchor="middle" fontSize={10} fill={value >= 100 ? "#10b981" : "#ef4444"} fontWeight={700}>
                        {value.toFixed(0)}%
                      </text>
                    )} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Site cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredSummary.map((s) => (
              <Card key={s.whCode} className="border border-border/50 shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group" onClick={() => setSelectedSite(s.siteCode)}>
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${getUtilBg(s.utilization)} opacity-70 group-hover:opacity-100 transition-opacity`} />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-muted-foreground tracking-wider">{s.whCode}</span>
                    {getUtilIcon(s.utilization)}
                  </div>
                  <p className="text-sm font-bold">{SITE_NAMES[s.siteCode as Site] || s.siteCode}</p>
                  <p className={`text-2xl font-black mt-1 tracking-tight ${getUtilColor(s.utilization)}`}>{s.utilization.toFixed(1)}%</p>
                  <p className="text-[10px] text-muted-foreground mt-2 group-hover:text-info transition-colors font-medium">Click for breakup →</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Performance Trend Section ── */}
          <Card className="border border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-info/5 to-transparent">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-info" />
                  <CardTitle className="text-base font-bold">Performance Trend</CardTitle>
                </div>
                <DateRangePicker startDate={trendRange.start} endDate={trendRange.end}
                  onStartChange={setTrendStart} onEndChange={setTrendEnd} enabledDateStrings={enabledDateStrings} />
              </div>
              {/* Filters Row */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <FilterDropdown
                  label="Sites"
                  options={allSiteCodes}
                  selected={trendSiteFilter}
                  onToggle={toggleSiteFilter}
                  onClear={() => setTrendSiteFilter([])}
                  getLabel={(code) => SITE_NAMES[code as Site] || code}
                />
                <FilterDropdown
                  label="Processes"
                  options={availableProcesses}
                  selected={trendProcessFilter}
                  onToggle={toggleProcessFilter}
                  onClear={() => setTrendProcessFilter([])}
                />
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground gap-1"
                    onClick={() => { setTrendSiteFilter([]); setTrendProcessFilter([]); }}>
                    <X className="h-3 w-3" /> Clear all filters
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                {trendRange.dates.length} day(s) • {trendSiteFilter.length > 0 ? `${trendSiteFilter.length} site(s)` : "All sites"}
                {trendProcessFilter.length > 0 ? ` • ${trendProcessFilter.length} process(es)` : " • All processes"}
              </p>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              {/* Average utilization bar chart */}
              {siteAverages.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-4 gradient-text-mp">Average Utilization by Site</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={siteAverages} barGap={4}>
                      <defs>
                        <linearGradient id="avgGreenGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                        <linearGradient id="avgRedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#f87171" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="site" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 140]} unit="%" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                        formatter={(value: number) => [`${value}%`, "Avg Utilization"]} />
                      <ReferenceLine y={100} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.4} />
                      <Bar dataKey="avg" radius={[8, 8, 0, 0]}
                        label={({ x, y, width, value }: any) => (
                          <text x={x + width / 2} y={y - 8} textAnchor="middle" fontSize={10} fill={value >= 100 ? "#10b981" : "#ef4444"} fontWeight={700}>
                            {value}%
                          </text>
                        )}>
                        {siteAverages.map((entry) => (
                          <Cell key={entry.siteCode} fill={entry.avg >= 100 ? "url(#avgGreenGrad)" : "url(#avgRedGrad)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Performance summary table */}
              {siteAverages.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-4 gradient-text-mp">Site Performance Summary</h3>
                  <div className="overflow-x-auto rounded-xl border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs bg-muted/40">
                          <TableHead className="font-bold">Site</TableHead>
                          <TableHead className="text-right font-bold">Avg %</TableHead>
                          <TableHead className="text-right">Min %</TableHead>
                          <TableHead className="text-right">Max %</TableHead>
                          <TableHead className="text-right">Days</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {siteAverages.map((sa) => {
                          const vals = trendRange.dates
                            .map((d) => getFilteredUtil(sa.siteCode, d.raw))
                            .filter((v): v is number => v !== undefined);
                          const min = vals.length ? Math.min(...vals) : 0;
                          const max = vals.length ? Math.max(...vals) : 0;
                          return (
                            <TableRow key={sa.siteCode} className="text-xs hover:bg-muted/20 transition-colors">
                              <TableCell className="font-semibold">{sa.site}</TableCell>
                              <TableCell className={`text-right font-bold ${getUtilColor(sa.avg)}`}>{sa.avg}%</TableCell>
                              <TableCell className={`text-right ${getUtilColor(min)}`}>{min.toFixed(1)}%</TableCell>
                              <TableCell className={`text-right ${getUtilColor(max)}`}>{max.toFixed(1)}%</TableCell>
                              <TableCell className="text-right font-medium">{vals.length}</TableCell>
                              <TableCell className="text-center">{getUtilIcon(sa.avg)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Daily line chart */}
              {dailyTrendData.length > 1 && (
                <div>
                  <h3 className="text-sm font-bold mb-4 gradient-text-mp">Daily Utilization Trend</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={dailyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 160]} unit="%" />
                      <ReferenceLine y={100} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "100%", position: "right", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.1)" }}
                        formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, SITE_NAMES[name as Site] || name]} />
                      <Legend formatter={(value: string) => SITE_NAMES[value as Site] || value} wrapperStyle={{ fontSize: 11 }} />
                      {trendSiteCodes.map((code) => (
                        <Line key={code} type="monotone" dataKey={code} stroke={SITE_COLORS[code] || "#888"}
                          strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5, strokeWidth: 2 }} connectNulls />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {trendRange.dates.length === 0 && (
                <p className="text-center text-muted-foreground py-8 font-medium">Select a date range to see performance trends</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default MPUtilizationTab;
