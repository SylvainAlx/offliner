/**
 * Where the visitor is, as far as installing the app is concerned:
 *  - "ios": iPhone or iPad (Safari, or another browser using the share sheet);
 *  - "android": Android browser able to install a web app;
 *  - "in-app": browser embedded in another app (Instagram, Facebook…), which
 *    cannot install anything: the page must be opened in the real browser;
 *  - "desktop": computer, where the goal is to open the app on a phone.
 */
export type InstallPlatform = "ios" | "android" | "in-app" | "desktop";

export interface InstallEnvironment {
  userAgent: string;
  maxTouchPoints: number;
}

const IN_APP_BROWSER =
  /FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|Snapchat|TikTok|musical_ly|Twitter|Line\/|Pinterest|GSA\//i;

export function detectInstallPlatform(environment: InstallEnvironment): InstallPlatform {
  const { userAgent, maxTouchPoints } = environment;
  if (IN_APP_BROWSER.test(userAgent)) return "in-app";

  // iPadOS presents itself as a Mac: only touch support tells them apart.
  const isIOS =
    /iPhone|iPad|iPod/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  if (isIOS) return "ios";

  if (/Android/i.test(userAgent)) return "android";
  return "desktop";
}

export interface StandaloneEnvironment {
  matchMedia: (query: string) => { matches: boolean };
  navigator: { standalone?: boolean };
}

/** True when the app runs installed (from the home screen), not in a tab. */
export function isRunningStandalone(environment: StandaloneEnvironment): boolean {
  return (
    environment.matchMedia("(display-mode: standalone)").matches ||
    environment.matchMedia("(display-mode: fullscreen)").matches ||
    // iOS Safari before display-mode support.
    environment.navigator.standalone === true
  );
}
