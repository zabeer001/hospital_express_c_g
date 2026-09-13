function toAuthUser(user) {
  const roleNames = user.roles.map(({ role }) => role.name);
  const permissions = [...new Set(user.roles.flatMap(({ role }) => (
    role.permissions.map(({ permission }) => permission.name)
  )))].sort();
  return { id: user.id, name: user.name, email: user.email, isActive: user.isActive, roleNames, permissions };
}

const authUserInclude = {
  roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
};

export { authUserInclude, toAuthUser };
