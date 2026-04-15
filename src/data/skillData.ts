export const SITES = ["MUM", "GGN", "BLR", "CCU", "GAU", "LKO", "COK", "HYD", "MAA", "CJB", "PAT", "VGA", "BBI"] as const;
export type Site = (typeof SITES)[number];

export const SITE_NAMES: Record<Site, string> = {
  MUM: "Mumbai", GGN: "Gurugram", BLR: "Bangalore", CCU: "Kolkata",
  GAU: "Gauhati", LKO: "New Lucknow", COK: "Cochin", HYD: "Hyderabad",
  MAA: "Chennai", CJB: "Coimbatore", PAT: "Patna", VGA: "Vijayawada", BBI: "Bhubaneswar",
};

export interface SiteMetrics {
  site: Site;
  totalBase: number;
  directCTI: number;
  indirectCTI: number;
  overallCTI: number;
}

// Current Skill Index Summary from each site sheet
export const siteMetrics: SiteMetrics[] = [
  { site: "MUM", totalBase: 102, directCTI: 1.17, indirectCTI: 2.27, overallCTI: 3.44 },
  { site: "GGN", totalBase: 169, directCTI: 1.06, indirectCTI: 1.44, overallCTI: 2.50 },
  { site: "BLR", totalBase: 135, directCTI: 0.72, indirectCTI: 2.86, overallCTI: 3.58 },
  { site: "CCU", totalBase: 157, directCTI: 1.32, indirectCTI: 2.52, overallCTI: 3.85 },
  { site: "GAU", totalBase: 38, directCTI: 2.03, indirectCTI: 3.26, overallCTI: 5.29 },
  { site: "LKO", totalBase: 38, directCTI: 2.55, indirectCTI: 1.71, overallCTI: 4.26 },
  { site: "COK", totalBase: 109, directCTI: 0.66, indirectCTI: 5.01, overallCTI: 5.67 },
  { site: "HYD", totalBase: 36, directCTI: 0.92, indirectCTI: 5.22, overallCTI: 6.14 },
  { site: "MAA", totalBase: 42, directCTI: 0.67, indirectCTI: 1.40, overallCTI: 2.07 },
  { site: "CJB", totalBase: 44, directCTI: 1.73, indirectCTI: 2.89, overallCTI: 4.61 },
  { site: "PAT", totalBase: 29, directCTI: 1.17, indirectCTI: 3.66, overallCTI: 4.83 },
  { site: "VGA", totalBase: 34, directCTI: 1.12, indirectCTI: 3.06, overallCTI: 4.18 },
  { site: "BBI", totalBase: 31, directCTI: 1.71, indirectCTI: 2.16, overallCTI: 3.87 },
];
