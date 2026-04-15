import { useMemo, useState } from "react";
import LockScreen from "@/components/LockScreen";
import { Users, BarChart3, TrendingUp, Award, Target, RefreshCw, Percent, Loader2, Activity } from "lucide-react";
import { SITES, type Site } from "@/data/skillData";
import { DPP_VALUES } from "@/data/employeeData";
import { filterEmployees } from "@/lib/employee-utils";
import { useLiveData } from "@/hooks/use-live-data";
import StatCard from "@/components/StatCard";
import CTIBarChart from "@/components/CTIBarChart";
import DPPSummaryChart from "@/components/DPPSummaryChart";
import SkillDistChart from "@/components/SkillDistChart";
import EmployeeTable from "@/components/EmployeeTable";
import MPUtilizationTab from "@/components/MPUtilizationTab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Index = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState("skill");
  const { employees: allEmployees, siteMetrics, loading, lastUpdated, refresh } = useLiveData();

  const [selectedSites, setSelectedSites] = useState<Site[]>([...SITES]);
  const [selectedDPP, setSelectedDPP] = useState<string[]>([...DPP_VALUES]);

  const isMp = activeTab === "mp";

  const toggleSite = (site: Site) => {
    setSelectedSites((prev) =>
      prev.includes(site) ? prev.filter((v) => v !== site) : [...prev, site]
    );
  };

  const toggleDPP = (dpp: string) => {
    setSelectedDPP((prev) =>
      prev.includes(dpp) ? prev.filter((v) => v !== dpp) : [...prev, dpp]
    );
  };

  const siteEmployees = useMemo(
    () => filterEmployees(allEmployees, { sites: selectedSites }),
    [allEmployees, selectedSites]
  );

  const filteredEmployees = useMemo(
    () => filterEmployees(allEmployees, { sites: selectedSites, dppValues: selectedDPP }),
    [allEmployees, selectedSites, selectedDPP]
  );

  const filteredMetrics = useMemo(
    () => siteMetrics.filter((s) => selectedSites.includes(s.site)),
    [siteMetrics, selectedSites]
  );

  const activeSites = filteredMetrics.filter((s) => s.overallCTI > 0);
  const avgCTI = activeSites.length
    ? (activeSites.reduce((sum, s) => sum + s.overallCTI, 0) / activeSites.length).toFixed(2)
    : "—";
  const avgDirect = activeSites.length
    ? (activeSites.reduce((sum, s) => sum + s.directCTI, 0) / activeSites.length).toFixed(2)
    : "—";

  const avgSkill = useMemo(() => {
    const withSkill = filteredEmployees.filter((e) => e.skillPct);
    if (!withSkill.length) return "—";
    const sum = withSkill.reduce((t, e) => t + parseInt(e.skillPct, 10), 0);
    return `${Math.round(sum / withSkill.length)}%`;
  }, [filteredEmployees]);

  const dpp3Count = filteredEmployees.filter((e) => e.directDPP === "3").length;

  const handleReset = () => {
    setSelectedSites([...SITES]);
    setSelectedDPP([...DPP_VALUES]);
  };

  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-xl theme-transition gradient-border"
        data-theme={activeTab}
        style={{
          background: isMp
            ? "linear-gradient(135deg, hsla(172,66%,50%,0.06), hsla(199,89%,48%,0.04))"
            : "linear-gradient(135deg, hsla(245,75%,58%,0.06), hsla(280,60%,55%,0.04))",
          borderColor: isMp ? "hsla(172,66%,50%,0.15)" : "hsla(245,75%,58%,0.15)",
        }}
      >
        <div className="container flex h-16 items-center gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-xl p-2.5 shadow-lg theme-transition ${isMp ? "gradient-bg-mp shadow-info/20" : "gradient-bg shadow-primary/20"}`}
            >
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className={`text-lg font-extrabold tracking-tight theme-transition ${isMp ? "gradient-text-mp" : "gradient-text"}`}>
              {isMp ? "MP Utilization" : "Skill Index Dashboard"}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {lastUpdated && (
              <span className="text-[10px] text-muted-foreground font-medium bg-muted/50 px-2.5 py-1 rounded-full">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="container space-y-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <TabsList className="bg-muted/60 p-1.5 rounded-2xl shadow-inner border border-border/30">
              <TabsTrigger
                value="skill"
                className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-500 gap-2 ${
                  activeTab === "skill"
                    ? "gradient-bg text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]"
                    : "hover:bg-muted"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Skill Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="mp"
                className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-500 gap-2 ${
                  activeTab === "mp"
                    ? "gradient-bg-mp text-primary-foreground shadow-lg shadow-info/25 scale-[1.02]"
                    : "hover:bg-muted"
                }`}
              >
                <Activity className="h-4 w-4" />
                MP Utilization
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full font-medium border border-border/30">
                <span className="font-bold text-foreground">{filteredEmployees.length}</span> / {siteEmployees.length} employees
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
                className={`gap-1.5 rounded-full transition-all duration-300 border-border/40 ${
                  isMp ? "hover:border-info/40 hover:bg-info/5 hover:text-info" : "hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                }`}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {loading ? "Loading…" : "Refresh"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-1.5 rounded-full border-border/40 hover:bg-primary/5 hover:text-primary hover:border-primary/40"
              >
                Reset
              </Button>
            </div>
          </div>

          <TabsContent value="skill" className="space-y-6 tab-content-enter">
            {loading && !allEmployees.length ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full gradient-bg opacity-20 blur-xl animate-pulse" />
                  <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
                </div>
                <p className="text-muted-foreground font-medium">Loading data…</p>
              </div>
            ) : (
              <>
                {/* Filters */}
                <div className="rounded-2xl border border-border/40 bg-card/95 backdrop-blur-sm p-5 shadow-lg shadow-primary/[0.03] space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.14em] gradient-text">Sites</span>
                    <Badge variant="outline" className="cursor-pointer select-none text-[11px] border-primary/25 hover:bg-primary/8 transition-all rounded-full font-medium" onClick={() => setSelectedSites([...SITES])}>Select All</Badge>
                    <Badge variant="outline" className="cursor-pointer select-none text-[11px] border-destructive/25 text-destructive hover:bg-destructive/8 transition-all rounded-full font-medium" onClick={() => setSelectedSites([])}>Deselect All</Badge>
                    <span className="w-px h-5 bg-border/60 mx-1" />
                    {SITES.map((site) => (
                      <Badge
                        key={site}
                        variant={selectedSites.includes(site) ? "default" : "outline"}
                        className={`cursor-pointer select-none text-[11px] transition-all duration-300 rounded-full ${
                          selectedSites.includes(site)
                            ? "gradient-bg border-0 text-primary-foreground shadow-md shadow-primary/20 scale-105"
                            : "hover:border-primary/30 hover:text-primary hover:scale-105 border-border/40"
                        }`}
                        onClick={() => toggleSite(site)}
                      >
                        {site}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.14em] gradient-text">DPP</span>
                    <Badge variant="outline" className="cursor-pointer select-none text-[11px] border-primary/25 hover:bg-primary/8 transition-all rounded-full font-medium" onClick={() => setSelectedDPP([...DPP_VALUES])}>Select All</Badge>
                    <Badge variant="outline" className="cursor-pointer select-none text-[11px] border-destructive/25 text-destructive hover:bg-destructive/8 transition-all rounded-full font-medium" onClick={() => setSelectedDPP([])}>Deselect All</Badge>
                    <span className="w-px h-5 bg-border/60 mx-1" />
                    {DPP_VALUES.map((dpp) => (
                      <Badge
                        key={dpp}
                        variant={selectedDPP.includes(dpp) ? "default" : "outline"}
                        className={`cursor-pointer select-none text-[11px] transition-all duration-300 rounded-full ${
                          selectedDPP.includes(dpp)
                            ? "gradient-bg border-0 text-primary-foreground shadow-md shadow-primary/20 scale-105"
                            : "hover:border-primary/30 hover:text-primary hover:scale-105 border-border/40"
                        }`}
                        onClick={() => toggleDPP(dpp)}
                      >
                        DPP {dpp}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  <StatCard icon={Users} title="Total Employees" value={siteEmployees.length} subtitle="Selected sites" />
                  <StatCard icon={Target} title="Filtered" value={filteredEmployees.length} subtitle="After DPP filter" />
                  <StatCard icon={TrendingUp} title="Avg Overall CTI" value={avgCTI} trend="up" subtitle="Selected sites" />
                  <StatCard icon={BarChart3} title="Avg Direct CTI" value={avgDirect} subtitle="Selected sites" />
                  <StatCard icon={Percent} title="Avg Skill %" value={avgSkill} subtitle="Filtered employees" />
                  <StatCard icon={Award} title="DPP 3 Count" value={dpp3Count} trend="up" subtitle="Highest proficiency" />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <CTIBarChart selectedSites={selectedSites} siteMetrics={filteredMetrics} />
                  <DPPSummaryChart selectedSites={selectedSites} allEmployees={allEmployees} />
                </div>

                <SkillDistChart selectedSites={selectedSites} allEmployees={allEmployees} />

                {/* Employee Table */}
                <EmployeeTable globalSites={selectedSites} globalDPP={selectedDPP} allEmployees={allEmployees} />
              </>
            )}
          </TabsContent>

          <TabsContent value="mp" className="tab-content-enter">
            <MPUtilizationTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
