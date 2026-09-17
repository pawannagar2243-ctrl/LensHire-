const ADMIN_ROLES = ['admin', 'super_admin'];

const isAdminRole = (role) => ADMIN_ROLES.includes(role);

module.exports = {
  ADMIN_ROLES,
  isAdminRole,
};
