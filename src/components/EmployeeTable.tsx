import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { type Site } from "@/data/skillData";
import { filterEmployees } from "@/lib/employee-utils";
import { FUNCTION_NAMES, FUNCTION_LABELS, type Employee } from "@/data/employeeData";
import { Search, ChevronDown, ChevronRight, CheckCircle2, XCircle, Users } from "lucide-react";

interface Props {
  globalSites: Site[];
  globalDPP: string[];
  allEmployees: Employee[];
}

const EmployeeTable = ({ globalSites, globalDPP, allEmployees }: Props) => {
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const base = filterEmployees(allEmployees, { sites: globalSites, dppValues: globalDPP });
    if (!search) return base;
    const query = search.toLowerCase();
    return base.filter((e) =>
      e.name.toLowerCase().includes(query) ||
      e.empCode.toLowerCase().includes(query) ||
      e.process.toLowerCase().includes(query) ||
      e.dept.toLowerCase().includes(query)
    );
  }, [allEmployees, globalSites, globalDPP, search]);

  const dppColor = (dpp: string) => {
    switch (dpp) {
      case "0": return "bg-destructive/10 text-destructive border-destructive/15";
      case "1": return "bg-warning/10 text-warning border-warning/15";
      case "2": return "bg-info/10 text-info border-info/15";
      case "3": return "bg-success/10 text-success border-success/15";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const skillColor = (pct: string) => {
    const num = parseInt(pct, 10);
    if (Number.isNaN(num)) return "text-muted-foreground";
    if (num >= 75) return "text-success font-bold";
    if (num >= 50) return "text-info font-semibold";
    if (num >= 25) return "text-warning font-medium";
    return "text-destructive";
  };

  const toggleRow = (key: string) => {
    setExpandedRow((prev) => (prev === key ? null : key));
  };

  return (
    <Card className="chart-card border-0 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-br from-[hsl(152,60%,40%)] to-[hsl(170,55%,42%)] p-2 shadow-md shadow-success/20">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
            <CardTitle className="text-base font-bold">Employee Details</CardTitle>
          </div>
          <Badge className="text-xs font-semibold gradient-bg border-0 text-primary-foreground px-3 py-1 rounded-full shadow-sm">
            {filtered.length} / {allEmployees.length}
          </Badge>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, code, process, dept..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted/40 border border-border/40 rounded-xl focus-visible:ring-primary/30 focus-visible:border-primary/30 transition-all"
          />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30 hover:bg-muted/50 border-b border-border/40">
              <TableHead className="w-8"></TableHead>
              <TableHead className="sticky left-0 z-10 bg-muted/40 backdrop-blur-sm font-bold text-xs uppercase tracking-wider text-muted-foreground">Employee</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Site</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Process</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Dept</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Designation</TableHead>
              <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">Skill %</TableHead>
              <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">Functions</TableHead>
              <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">Cross Trained</TableHead>
              <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">DPP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length ? (
              filtered.slice(0, 200).map((employee, index) => {
                const rowKey = `${employee.empCode}-${index}`;
                const isExpanded = expandedRow === rowKey;
                const yCount = Object.values(employee.functions).filter((v) => v.toUpperCase() === "Y").length;

                return (
                  <React.Fragment key={rowKey}>
                    <TableRow
                      className={`cursor-pointer transition-all duration-200 ${isExpanded ? "bg-primary/[0.04] border-l-2 border-l-primary" : "hover:bg-muted/30"}`}
                      onClick={() => toggleRow(rowKey)}
                    >
                      <TableCell className="w-8 px-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-primary transition-transform" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
                        )}
                      </TableCell>
                      <TableCell className="sticky left-0 z-10 whitespace-nowrap bg-card">
                        <div className="font-semibold text-foreground text-sm">{employee.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{employee.empCode}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] font-medium border-primary/20 text-primary rounded-lg">
                          {employee.site}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-xs text-foreground/80">{employee.process || "—"}</TableCell>
                      <TableCell className="text-xs text-foreground/80">{employee.dept || "—"}</TableCell>
                      <TableCell className="text-xs text-foreground/80">{employee.designation || "—"}</TableCell>
                      <TableCell className={`text-center text-sm ${skillColor(employee.skillPct)}`}>
                        {employee.skillPct || "—"}
                      </TableCell>
                      <TableCell className="text-center text-xs font-medium">
                        <span className="inline-flex items-center gap-0.5 bg-primary/8 text-primary px-2 py-0.5 rounded-md font-semibold">
                          {yCount}<span className="text-muted-foreground font-normal">/12</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-xs">{employee.crossTrained || "—"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`${dppColor(employee.directDPP)} text-xs font-bold rounded-lg px-2.5`}>
                          {employee.directDPP || "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-gradient-to-r from-primary/[0.02] to-accent/[0.02] hover:bg-primary/[0.03] border-l-2 border-l-primary">
                        <TableCell colSpan={10} className="p-5">
                          <div className="space-y-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Function Breakdown — <span className="text-primary">{yCount}</span> of 12 trained
                            </p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {FUNCTION_NAMES.map((fn) => {
                                const val = (employee.functions[fn] || "N").toUpperCase() === "Y";
                                return (
                                  <div
                                    key={fn}
                                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                                      val
                                        ? "bg-success/10 text-success border border-success/20 shadow-sm"
                                        : "bg-muted/40 text-muted-foreground border border-border/30"
                                    }`}
                                  >
                                    {val ? (
                                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                    ) : (
                                      <XCircle className="h-3.5 w-3.5 shrink-0 opacity-30" />
                                    )}
                                    <span className="truncate">{FUNCTION_LABELS[fn] || fn}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="py-16 text-center text-sm text-muted-foreground">
                  No employees match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default EmployeeTable;
