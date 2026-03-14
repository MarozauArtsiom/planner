import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { hasSmRights } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { ProjectContent } from "./project-content";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: id } },
    include: { project: true },
  });
  if (!membership) notFound();

  const project = membership.project;
  const smRights = hasSmRights(user, membership);

  return (
    <ProjectContent
      projectId={id}
      projectName={project.name}
      userName={user.name}
      userRole={user.role}
      hasSmRights={smRights}
      userIsSm={user.isScrumMaster}
    />
  );
}
