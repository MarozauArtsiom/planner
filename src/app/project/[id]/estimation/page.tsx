import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { EstimationBoard } from "@/components/estimation/estimation-board";

export default async function ProjectEstimationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: id } },
  });
  if (!membership) notFound();

  return <EstimationBoard projectId={id} />;
}
