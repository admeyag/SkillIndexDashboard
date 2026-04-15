import { type Employee } from "@/data/employeeData";
import { type Site } from "@/data/skillData";

export const isRealEmployee = (employee: Employee) => {
  const code = employee.empCode.trim();
  const name = employee.name.trim();
  const designation = employee.designation.trim();
  const skillPct = employee.skillPct.trim();

  return Boolean(code && name && designation && skillPct.endsWith("%"));
};

export const filterEmployees = (
  allEmployees: Employee[],
  {
    sites,
    dppValues,
  }: {
    sites?: Site[];
    dppValues?: string[];
  }
) => {
  return allEmployees.filter((employee) => {
    const siteMatch = !sites?.length || sites.includes(employee.site as Site);
    const dppMatch = !dppValues?.length || dppValues.includes(employee.directDPP || "0");
    return siteMatch && dppMatch;
  });
};
