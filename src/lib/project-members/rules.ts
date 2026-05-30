type ActiveAssignmentLike = { id: string; removedAt?: Date | null } | null;

export function hasActiveAssignment(record: ActiveAssignmentLike): boolean {
  if (!record) return false;
  return record.removedAt == null;
}

export function buildRemoveMemberUpdate() {
  return { removedAt: new Date() };
}
