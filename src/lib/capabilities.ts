import capabilitiesConfig from "@/config/capabilities.json";

export type CapabilityScope = "mvp" | "post_mvp";
export type CapabilityStatus = "working" | "partial" | "stub" | "out_of_scope";

export type Capability = {
  id: string;
  requirementId: string;
  title: string;
  area: string;
  scope: CapabilityScope;
  status: CapabilityStatus;
  uiRoutes: string[];
  backendMappings: string[];
  uiRequired: boolean;
};

const capabilities = capabilitiesConfig.capabilities as Capability[];
const byId = new Map(capabilities.map((capability) => [capability.id, capability]));

export function getCapabilities() {
  return capabilities;
}

export function getCapability(id: string) {
  return byId.get(id) ?? null;
}

export function isCapabilityEnabled(id: string) {
  const capability = getCapability(id);
  if (!capability) return false;
  return capability.status === "working" || capability.status === "partial";
}

export function capabilityStatusLabel(status: CapabilityStatus) {
  if (status === "working") return "Working";
  if (status === "partial") return "Partial";
  if (status === "stub") return "Stub";
  return "Out of scope";
}

export function capabilityStatusClasses(status: CapabilityStatus) {
  if (status === "working") return "bg-emerald-100 text-emerald-700";
  if (status === "partial") return "bg-amber-100 text-amber-700";
  if (status === "stub") return "bg-slate-200 text-slate-700";
  return "bg-rose-100 text-rose-700";
}

export function getCapabilitySummary() {
  const total = capabilities.length;
  const working = capabilities.filter((capability) => capability.status === "working").length;
  const partial = capabilities.filter((capability) => capability.status === "partial").length;
  const stub = capabilities.filter((capability) => capability.status === "stub").length;
  const outOfScope = capabilities.filter(
    (capability) => capability.status === "out_of_scope",
  ).length;
  const mvpTotal = capabilities.filter((capability) => capability.scope === "mvp").length;
  const mvpReady = capabilities.filter(
    (capability) =>
      capability.scope === "mvp" &&
      (capability.status === "working" || capability.status === "partial"),
  ).length;

  return {
    total,
    working,
    partial,
    stub,
    outOfScope,
    mvpTotal,
    mvpReady,
    mvpProgress: mvpTotal ? Math.round((mvpReady / mvpTotal) * 100) : 0,
  };
}
