import { useState, useCallback, useEffect } from "react";
import { parseCSV } from "@/lib/csv-parser";
import type { Employee } from "@/data/employeeData";
import type { Site, SiteMetrics } from "@/data/skillData";

const BASE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRSrnvWOOn9IumCmnKC6o4YvoMIhSvOemDhtku2xlt2xpenTWDYm9ti3F2fQZOpbmXSnA1IeOqSzQvg/pub?output=csv&gid=";

// Site code -> GID (excluding old LKO, Sheet65, Summary, Links)
const SHEET_GIDS: Record<string, string> = {
  MUM: "322688372",
  GGN: "1922222717",
  BLR: "2049465768",
  CCU: "2058105476",
  COK: "1013795999",
  LKO: "313251050",
  GAU: "1258373629",
  HYD: "1854730542",
  MAA: "1308201792",
  PAT: "1015635280",
  CJB: "1691529447",
  VGA: "624455190",
  BBI: "1678477274",
};

const FUNC_NAMES_CSV = [
  "Inward",
  "Picking",
  "Packing",
  "QC",
  "MIGO",
  "RackInOut",
  "RTVDisc",
  "MIRO",
  "InvAudit",
  "Dispatch",
  "RTO",
  "RVPClaim",
];

interface ColumnMap {
  designationCol: number;
  totalFunctionsCol: number;
  crossTrainedCol: number;
  skillPctCol: number;
  directDPPCol: number;
  functionStartCol: number;
}

const normalizeCell = (value: string | undefined) =>
  (value || "").trim().toLowerCase().replace(/\s+/g, " ");

const parseNumericValue = (value: string | undefined): number | null => {
  const cleaned = (value || "").replace(/[,%]/g, "").trim();
  if (!cleaned) return null;

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

function findColumnIndex(rows: string[][], matcher: (value: string) => boolean): number {
  for (let rowIndex = 0; rowIndex < Math.min(5, rows.length); rowIndex++) {
    const columnIndex = rows[rowIndex].findIndex((cell) => matcher(normalizeCell(cell)));
    if (columnIndex !== -1) return columnIndex;
  }

  return -1;
}

function getFallbackColumnMap(rows: string[][]): ColumnMap {
  const maxColumns = Math.max(...rows.slice(0, 5).map((row) => row.length), 0);
  const isMUMLayout = rows.some((row, index) => index < 2 && normalizeCell(row[0]).includes("employee information"));

  if (isMUMLayout) {
    return {
      designationCol: 7,
      totalFunctionsCol: 47,
      crossTrainedCol: 48,
      skillPctCol: 52,
      directDPPCol: 57,
      functionStartCol: 35,
    };
  }

  if (maxColumns >= 58) {
    return {
      designationCol: 8,
      totalFunctionsCol: 48,
      crossTrainedCol: 49,
      skillPctCol: 53,
      directDPPCol: 57,
      functionStartCol: 36,
    };
  }

  if (maxColumns >= 49) {
    return {
      designationCol: 8,
      totalFunctionsCol: 39,
      crossTrainedCol: 40,
      skillPctCol: 44,
      directDPPCol: 48,
      functionStartCol: 27,
    };
  }

  return {
    designationCol: 8,
    totalFunctionsCol: 36,
    crossTrainedCol: 37,
    skillPctCol: 41,
    directDPPCol: 45,
    functionStartCol: 24,
  };
}

function getColumnMap(rows: string[][]): ColumnMap {
  const fallback = getFallbackColumnMap(rows);

  const designationCol = findColumnIndex(rows, (value) => value === "designation");
  const totalFunctionsCol = findColumnIndex(rows, (value) => value.includes("total no of funct"));
  const crossTrainedCol = findColumnIndex(rows, (value) => value.includes("cross trained functions"));
  const skillPctCol = findColumnIndex(rows, (value) => value.includes("skill %"));
  const directDPPCol = findColumnIndex(rows, (value) => value.includes("direct dpp"));

  const resolvedTotalFunctionsCol = totalFunctionsCol !== -1 ? totalFunctionsCol : fallback.totalFunctionsCol;

  return {
    designationCol: designationCol !== -1 ? designationCol : fallback.designationCol,
    totalFunctionsCol: resolvedTotalFunctionsCol,
    crossTrainedCol: crossTrainedCol !== -1 ? crossTrainedCol : fallback.crossTrainedCol,
    skillPctCol: skillPctCol !== -1 ? skillPctCol : fallback.skillPctCol,
    directDPPCol: directDPPCol !== -1 ? directDPPCol : fallback.directDPPCol,
    functionStartCol: resolvedTotalFunctionsCol - 12,
  };
}

function readSummaryMetric(row: string[]): { label: string; value: number } | null {
  const normalizedRow = row.map((cell) => normalizeCell(cell));
  const labelIndex = normalizedRow.findIndex(
    (cell) =>
      cell.includes("total base") ||
      cell.includes("direct process path cti") ||
      cell.includes("indirect process path cti") ||
      cell.includes("overall cti")
  );

  if (labelIndex === -1) return null;

  for (let i = labelIndex + 1; i < Math.min(labelIndex + 4, row.length); i++) {
    const value = parseNumericValue(row[i]);
    if (value !== null) {
      return { label: normalizedRow[labelIndex], value };
    }
  }

  return null;
}

function parseSiteCSV(csv: string, siteCode: string): {
  employees: Employee[];
  metrics: SiteMetrics;
} {
  const rows = parseCSV(csv);
  const columns = getColumnMap(rows);
  const employees: Employee[] = [];
  let totalBase = 0;
  let directCTI = 0;
  let indirectCTI = 0;
  let overallCTI = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const normalizedRow = row.map((cell) => normalizeCell(cell));

    if (
      normalizedRow.some((cell) => cell.includes("skill index summary")) &&
      !normalizedRow.some((cell) => cell.includes("contract"))
    ) {
      for (let j = i + 1; j < Math.min(i + 7, rows.length); j++) {
        const metric = readSummaryMetric(rows[j]);
        if (!metric) continue;

        if (metric.label.includes("total base")) totalBase = metric.value;
        else if (metric.label.includes("indirect process path cti")) indirectCTI = metric.value;
        else if (metric.label.includes("direct process path cti")) directCTI = metric.value;
        else if (metric.label.includes("overall cti")) overallCTI = metric.value;
      }
      continue;
    }

    const empCode = (row[0] || "").trim();
    const name = (row[1] || "").trim();
    if (!empCode || !name) continue;

    const normalizedEmpCode = empCode.toLowerCase();
    if (normalizedEmpCode === "emp code" || normalizedEmpCode.startsWith("emp code") || normalizedEmpCode.startsWith("employee")) continue;
    if (["grand total", "total", "lc0", "lc1", "lc2", "lc3", "lc4", "lc5", "low", "medium", "high", "ageing", "status"].includes(normalizedEmpCode)) continue;
    if (empCode.startsWith("1.") || empCode.startsWith("2.") || empCode.startsWith("3.")) continue;
    if (/^(0-|1-|4-|6-|1 yr)/i.test(empCode)) continue;

    const designation = (row[columns.designationCol] || "").trim();
    const skillPct = (row[columns.skillPctCol] || "").trim();
    if (!designation || !skillPct.endsWith("%")) continue;

    const functions: Record<string, string> = {};
    for (let f = 0; f < FUNC_NAMES_CSV.length; f++) {
      const value = (row[columns.functionStartCol + f] || "N").trim().toUpperCase();
      functions[FUNC_NAMES_CSV[f]] = value === "Y" ? "Y" : "N";
    }

    employees.push({
      empCode,
      name,
      site: siteCode,
      doj: (row[3] || "").trim(),
      days: (row[4] || "").trim(),
      process: (row[5] || "").trim(),
      dept: (row[6] || "").trim(),
      designation,
      skillPct,
      directDPP: (row[columns.directDPPCol] || "0").trim(),
      totalFunctions: (row[columns.totalFunctionsCol] || "12").trim(),
      crossTrained: (row[columns.crossTrainedCol] || "0").trim(),
      functions,
    });
  }

  return {
    employees,
    metrics: {
      site: siteCode as Site,
      totalBase: totalBase || employees.length,
      directCTI,
      indirectCTI,
      overallCTI,
    },
  };
}

export interface LiveData {
  employees: Employee[];
  siteMetrics: SiteMetrics[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useLiveData(): LiveData {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [siteMetrics, setSiteMetrics] = useState<SiteMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const entries = Object.entries(SHEET_GIDS);
      // Fetch all sites in parallel with a cache-bust but no artificial delay
      const results = await Promise.all(
        entries.map(async ([siteCode, gid]) => {
          const res = await fetch(`${BASE_URL}${gid}&_t=${Date.now()}`, {
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`Failed to fetch ${siteCode}`);
          const text = await res.text();
          return parseSiteCSV(text, siteCode);
        })
      );

      const allEmployees: Employee[] = [];
      const allMetrics: SiteMetrics[] = [];
      for (const r of results) {
        allEmployees.push(...r.employees);
        allMetrics.push(r.metrics);
      }

      setEmployees(allEmployees);
      setSiteMetrics(allMetrics);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { employees, siteMetrics, loading, error, lastUpdated, refresh: fetchData };
}
