export function getBackupFileName(suffix = "sauvegarde"): string {
  return `offliner-${suffix}-${new Date().toISOString().slice(0, 10)}.json`;
}

export function downloadJson(data: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * The save as a file the device can share (cloud drive, e-mail, messaging), or
 * null where sharing files is not possible. Some browsers (Chrome on Android)
 * only share a few file types: the save then goes as a text file, which the
 * import accepts as well.
 */
export function getShareableBackupFile(data: unknown, fileName: string): File | null {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") {
    return null;
  }
  const content = JSON.stringify(data);
  const candidates = [
    new File([content], fileName, { type: "application/json" }),
    new File([content], fileName.replace(/\.json$/, ".txt"), { type: "text/plain" }),
  ];
  try {
    return candidates.find((file) => navigator.canShare({ files: [file] })) ?? null;
  } catch {
    return null;
  }
}

/** Whether this device can share a save file at all. */
export function canShareBackupFile(): boolean {
  return getShareableBackupFile({}, getBackupFileName()) !== null;
}
