export default (initialState: { currentUser?: API.User }) => {
  const { currentUser } = initialState || {};
  const permissions = currentUser?.permissions || [];

  const canSeeAdmin = currentUser?.roles?.some((role) => role.code === 'ADMIN') || false;

  return {
    canSeeAdmin,
    canSeeFeatures: permissions.includes('MENU_FEATURES'),
    canSeePackages: permissions.includes('MENU_PACKAGES'),
    canSeeUsers: permissions.includes('MENU_USERS'),
    canSeeRoles: permissions.includes('MENU_ROLES'),
    canSeePermissions: permissions.includes('MENU_PERMISSIONS'),
    canSeeSysConfig: permissions.includes('MENU_SYS_CONFIG'),
    canSeeRecords: permissions.includes('MENU_RECORDS'),
    canSeeRecordFeatures: permissions.includes('MENU_RECORDS_FEATURES'),
    canSeeRecordRules: permissions.includes('MENU_RECORDS_RULES'),
  };
};
