import type { User } from "@/generated/prisma/client";

export function isScrumMaster(user: User): boolean {
  return user.role === "SCRUM_MASTER";
}

export function canEditBoard(user: User): boolean {
  return isScrumMaster(user);
}
