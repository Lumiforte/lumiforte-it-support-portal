export const TICKET_CATEGORIES = {
  IT: {
    label: "IT",
    subcategories: [
      { value: "hardware", label: "Hardware" },
      { value: "software", label: "Software" },
      { value: "network", label: "Network" },
      { value: "email", label: "Email" },
      { value: "account", label: "Account Access" },
      { value: "printer", label: "Printing" },
      { value: "intercom", label: "Intercom Baarle-Nassau" },
      { value: "salesforce", label: "Salesforce" },
      { value: "websites", label: "Websites" },
      { value: "intranet", label: "Intranet" },
      { value: "licenses", label: "Licenses" },
    ]
  },
  Building: {
    label: "Building",
    subcategories: [
      { value: "maintenance", label: "Maintenance" },
      { value: "cleaning", label: "Cleaning" },
      { value: "security", label: "Security" },
      { value: "hvac", label: "HVAC / Climate Control" },
      { value: "access", label: "Access / Keys" },
    ]
  },
  Workplace: {
    label: "Workplace",
    subcategories: [
      { value: "desk", label: "Desk / Chair" },
      { value: "equipment", label: "Equipment" },
      { value: "supplies", label: "Supplies" },
      { value: "ergonomics", label: "Ergonomics" },
    ]
  },
  Employees: {
    label: "Employees",
    subcategories: [
      { value: "hr", label: "HR / Personnel" },
      { value: "onboarding", label: "Onboarding" },
      { value: "offboarding", label: "Offboarding" },
      { value: "payroll", label: "Payroll" },
      { value: "benefits", label: "Benefits" },
    ]
  },
  Other: {
    label: "Other",
    subcategories: [
      { value: "other", label: "Other" },
    ]
  }
} as const;

export type MainCategory = keyof typeof TICKET_CATEGORIES;
export type SubCategory = typeof TICKET_CATEGORIES[MainCategory]["subcategories"][number]["value"];

// Legacy support - map old categories to new structure
export const LEGACY_CATEGORY_MAPPING: Record<string, { main: MainCategory; sub: string }> = {
  hardware: { main: "IT", sub: "hardware" },
  software: { main: "IT", sub: "software" },
  network: { main: "IT", sub: "network" },
  email: { main: "IT", sub: "email" },
  account: { main: "IT", sub: "account" },
  printer: { main: "IT", sub: "printer" },
  intercom: { main: "IT", sub: "intercom" },
  salesforce: { main: "IT", sub: "salesforce" },
  websites: { main: "IT", sub: "websites" },
  intranet: { main: "IT", sub: "intranet" },
  licenses: { main: "IT", sub: "licenses" },
  other: { main: "Other", sub: "other" },
};
