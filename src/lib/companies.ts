export const COMPANIES = [
  { value: "Lumiforte EMEA SAS", label: "Lumiforte EMEA SAS", color: "#0088FE" },
  { value: "Lumiforte EMEA BV", label: "Lumiforte EMEA BV", color: "#00C49F" },
  { value: "Lumiforte Americas Ltd.", label: "Lumiforte Americas Ltd.", color: "#FF8042" },
  { value: "Lumiforte Asia / Lumiray", label: "Lumiforte Asia / Lumiray", color: "#8884d8" },
  { value: "Sportlines GmbH", label: "Sportlines GmbH", color: "#82ca9d" },
  { value: "Other / External", label: "Other / External", color: "#ffc658" },
] as const;

export const getCompanyColor = (companyName: string | null | undefined): string => {
  if (!companyName) return "#cccccc";
  const company = COMPANIES.find(c => c.value === companyName);
  return company?.color || "#cccccc";
};
