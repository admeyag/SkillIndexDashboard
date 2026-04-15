import { useState, useCallback, useEffect } from "react";
import { parseCSV } from "@/lib/csv-parser";

const MP_BASE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR-hrtTa9_vmMV7xOG3SljscABvn-EPSMp64dSO0V0NjHVClg721-Ujl1wFL2zCjF4NR21vjMRqucot/pub?output=csv&gid=";

// Site-specific sheets for process breakup
const SITE_GIDS: Record<string, string> = {
  MUM: "1824005138",
  GGN: "408413725",
  BLR: "1738528825",
  CCU: "1414407287",
  GAU: "73795269",
  LKO: "1586255005",
  MAA: "2097076234",
  HYD: "2137219209",
  COK: "126729779",
  VGA: "1239159921",
  CJB: "921932279",
  PAT: "172834437",
  BBI: "1044118854",
};

// Map site codes to WH codes for display
const SITE_TO_WH: Record<string, string> = {
  MUM: "MUM-02",
  GGN: "GGN-04",
  BLR: "BLR-10",
  CCU: "CCU-12",
  GAU: "GHY-16",
  LKO: "LKO-21",
  MAA: "MAA-25",
  HYD: "HYD-28",
  COK: "COK-29",
  VGA: "VGA-40",
  CJB: "CJB-42",
  PAT: "PAT-45",
  BBI: "BBI-47",
};

export const PROCESS_NAMES = [
  "Inbound", "B2C", "EasyEcom", "Audit", "RTS B2B", "RTS B2C",
  "DS STO", "FC IWT", "RTO", "Offline Store IB", "Offline Store OB",
];

export interface ProcessBreakup {
  date: string;
  process: string;
  projected: string;
  received: string;
  actual: string;
  percentage: string;
  gap: string;
  lossHrs: string;
}

export interface SiteDailyBreakup {
  date: string;
  processes: ProcessBreakup[];
  projReqHrs: string;
  actReqHrs: string;
  projLMCount: string;
  actMPCount: string;
  lmVsActual: string;
  otHrs: string;
  presentCount: string;
  finalCount: string;
  dppUtilization: string;
  remark: string;
}

export interface SiteUtilization {
  date: string;
  siteCode: string;
  whCode: string;
  utilization: number;
  dppUtilization: string;
  remark: string;
}

function parseSiteCSV(csv: string): SiteDailyBreakup[] {
  const rows = parseCSV(csv);
  if (rows.length < 3) return [];

  const results: SiteDailyBreakup[] = [];

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const date = (row[0] || "").trim();
    if (!date || !/^\d{2}-/.test(date)) continue;

    const processes: ProcessBreakup[] = [];
    for (let p = 0; p < PROCESS_NAMES.length; p++) {
      const base = p * 7;
      processes.push({
        date,
        process: PROCESS_NAMES[p],
        projected: (row[base + 1] || "0").trim(),
        received: (row[base + 2] || "0").trim(),
        actual: (row[base + 3] || "0").trim(),
        percentage: (row[base + 4] || "0%").trim(),
        gap: (row[base + 5] || "0").trim(),
        lossHrs: (row[base + 6] || "0").trim(),
      });
    }

    // Column 82 (1-indexed) = index 81 = summaryBase(77) + 4 for LM vs Actual
    const summaryBase = 77;
    results.push({
      date,
      processes,
      projReqHrs: (row[summaryBase] || "").trim(),
      actReqHrs: (row[summaryBase + 1] || "").trim(),
      projLMCount: (row[summaryBase + 2] || "").trim(),
      actMPCount: (row[summaryBase + 3] || "").trim(),
      lmVsActual: (row[summaryBase + 4] || "").trim(),
      otHrs: (row[summaryBase + 5] || "").trim(),
      presentCount: (row[summaryBase + 6] || "").trim(),
      finalCount: (row[summaryBase + 7] || "").trim(),
      dppUtilization: (row[summaryBase + 8] || "").trim(),
      remark: (row[summaryBase + 9] || "").trim(),
    });
  }

  return results;
}

export interface MPUtilizationData {
  allSiteData: Record<string, SiteDailyBreakup[]>;
  availableDates: string[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
  getUtilizationForDate: (date: string) => SiteUtilization[];
  getBreakupForSiteDate: (siteCode: string, date: string) => SiteDailyBreakup | null;
}

export function useMPUtilization(): MPUtilizationData {
  const [allSiteData, setAllSiteData] = useState<Record<string, SiteDailyBreakup[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAllSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const entries = Object.entries(SITE_GIDS);
      const results = await Promise.all(
        entries.map(async ([siteCode, gid]): Promise<[string, SiteDailyBreakup[]]> => {
          const res = await fetch(`${MP_BASE_URL}${gid}&_t=${Date.now()}`, {
            cache: "no-store",
          });
          if (!res.ok) return [siteCode, []];
          const text = await res.text();
          return [siteCode, parseSiteCSV(text)];
        })
      );
      const data: Record<string, SiteDailyBreakup[]> = {};
      for (const [code, breakups] of results) {
        data[code] = breakups;
      }
      setAllSiteData(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllSites();
  }, [fetchAllSites]);

  // Get all unique dates across all sites, sorted descending
  const availableDates = (() => {
    const dateSet = new Set<string>();
    for (const breakups of Object.values(allSiteData)) {
      for (const b of breakups) {
        dateSet.add(b.date);
      }
    }
    return Array.from(dateSet).sort((a, b) => {
      const da = new Date(a);
      const db = new Date(b);
      return db.getTime() - da.getTime();
    });
  })();

  // Build utilization summary for a given date from site sheets
  const getUtilizationForDate = useCallback((date: string): SiteUtilization[] => {
    const results: SiteUtilization[] = [];
    for (const [siteCode, breakups] of Object.entries(allSiteData)) {
      const dayData = breakups.find((b) => b.date === date);
      if (!dayData) continue;
      const util = parseFloat(dayData.lmVsActual.replace("%", "")) || 0;
      results.push({
        date,
        siteCode,
        whCode: SITE_TO_WH[siteCode] || siteCode,
        utilization: util,
        dppUtilization: dayData.dppUtilization,
        remark: dayData.remark,
      });
    }
    return results;
  }, [allSiteData]);

  const getBreakupForSiteDate = useCallback((siteCode: string, date: string): SiteDailyBreakup | null => {
    const breakups = allSiteData[siteCode];
    if (!breakups) return null;
    return breakups.find((b) => b.date === date) || null;
  }, [allSiteData]);

  return {
    allSiteData,
    availableDates,
    loading,
    error,
    lastUpdated,
    refresh: fetchAllSites,
    getUtilizationForDate,
    getBreakupForSiteDate,
  };
}
