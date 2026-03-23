import {
  capabilityStatusClasses,
  capabilityStatusLabel,
  getCapability,
} from "@/lib/capabilities";

export function CapabilityPill({
  capabilityId,
  compact = false,
}: {
  capabilityId: string;
  compact?: boolean;
}) {
  const capability = getCapability(capabilityId);

  if (!capability) {
    return (
      <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">
        Unknown
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${capabilityStatusClasses(
        capability.status,
      )}`}
      title={capability.title}
    >
      {compact ? capabilityStatusLabel(capability.status) : `${capability.id} · ${capabilityStatusLabel(capability.status)}`}
    </span>
  );
}
