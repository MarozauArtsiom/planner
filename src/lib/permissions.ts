export function hasSmRights(
  user: { isScrumMaster: boolean },
  membership?: { isScrumMaster: boolean } | null,
): boolean {
  return user.isScrumMaster || membership?.isScrumMaster === true;
}
