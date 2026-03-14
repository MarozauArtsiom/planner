import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { User } from "@/generated/prisma/client";

export async function getCurrentUser(): Promise<User | null> {
  const userId = await getSession();
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}
