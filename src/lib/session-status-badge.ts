import type { SessionStatus } from "@/generated/prisma/enums";

const SESSION_STATUS_BADGE_CLASSES: Record<SessionStatus, string> = {
  AVAILABLE: "bg-ok text-paper",
  CANCELLED: "bg-danger text-paper",
};

export function sessionStatusBadgeClasses(status: SessionStatus): string {
  return SESSION_STATUS_BADGE_CLASSES[status];
}

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  AVAILABLE: "Available",
  CANCELLED: "Cancelled",
};
