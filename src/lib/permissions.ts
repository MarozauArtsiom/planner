export function hasSmRights(
  userId: string,
  membership?: { isScrumMaster: boolean } | null,
  project?: { ownerId: string } | null,
): boolean {
  return project?.ownerId === userId || membership?.isScrumMaster === true;
}
