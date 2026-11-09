// ============================================================================
// UTILITY HELPERS: TENURE CALCULATOR, FORMATTERS & RBAC PERMISSIONS
// ============================================================================

export function calculateTenure(startDateStr, endDateStr = null) {
  if (!startDateStr) return 'N/A';
  const start = new Date(startDateStr);
  const end = endDateStr ? new Date(endDateStr) : new Date();
  if (isNaN(start.getTime())) return 'N/A';

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const parts = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`);
  parts.push(`${days} day${days !== 1 ? 's' : ''}`);

  return `${parts.join(', ')} (${diffDays.toLocaleString()} total days)`;
}

export function formatTimestamp(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function getRoleDefaultPermissions(role) {
  if (role === 'SUPER_ADMIN') {
    return {
      canManageUsers: true,
      canAddCamps: true,
      canDeleteCamps: true,
      canEditOccupants: true,
      canExportReports: true,
      canApproveTransfers: true,
    };
  }
  if (role === 'CAMP_EDITOR') {
    return {
      canManageUsers: false,
      canAddCamps: false,
      canDeleteCamps: true,
      canEditOccupants: true,
      canExportReports: true,
      canApproveTransfers: false,
    };
  }
  // AUDITOR: Can approve cost center transfers and export reports, read-only for camp/room edits
  return {
    canManageUsers: false,
    canAddCamps: false,
    canDeleteCamps: false,
    canEditOccupants: false,
    canExportReports: true,
    canApproveTransfers: true,
  };
}