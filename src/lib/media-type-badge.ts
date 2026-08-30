import type { MediaType } from "@/generated/prisma/enums";

const MEDIA_TYPE_BADGE_CLASSES: Record<MediaType, string> = {
  PHOTO: "bg-accent-ink text-paper",
  VIDEO: "bg-accent text-paper",
  MIXED: "bg-[#6b4a8a] text-paper",
  OTHER: "bg-ink-soft text-paper",
};

export function mediaTypeBadgeClasses(mediaType: MediaType): string {
  return MEDIA_TYPE_BADGE_CLASSES[mediaType];
}
