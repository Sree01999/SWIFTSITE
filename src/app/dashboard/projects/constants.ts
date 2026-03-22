export const PROJECT_STATUS_OPTIONS = [
  "planning",
  "building",
  "deployed",
  "suspended",
  "error",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUS_OPTIONS)[number];
