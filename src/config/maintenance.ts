let isMaintenanceModeActive = process.env.MAINTENANCE_MODE === "true";

export function isMaintenanceMode(): boolean {
  return isMaintenanceModeActive;
}

export function setMaintenanceMode(active: boolean): void {
  isMaintenanceModeActive = active;
}
