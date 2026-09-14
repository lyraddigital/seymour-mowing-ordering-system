export function internalUser() {
  return {
    id: crypto.randomUUID(),
    email: "admin@example.test",
    displayName: "Test Admin",
    role: "admin" as const,
    createdAt: 1800000000000,
    updatedAt: 1800000000000,
  };
}
