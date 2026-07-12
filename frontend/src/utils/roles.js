export const ROLES = {
  ADMIN: 'Admin',
  ASSET_MANAGER: 'AssetManager',
  DEPARTMENT_HEAD: 'DepartmentHead',
  EMPLOYEE: 'Employee',
};

export const canRegisterAssets = (role) => [ROLES.ADMIN, ROLES.ASSET_MANAGER].includes(role);
export const canAllocate = (role) => [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD].includes(role);
export const canApproveMaintenance = (role) => [ROLES.ADMIN, ROLES.ASSET_MANAGER].includes(role);
export const isAdmin = (role) => role === ROLES.ADMIN;
