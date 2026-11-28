import { CONTACT_EMAIL, OFFLINER_VERSION } from "./constants";

/**
 * Opens the player's mail app on a message to the publisher. Only the version
 * is filled in: nothing of the game is attached.
 */
export function getFeedbackUrl(version: string = OFFLINER_VERSION): string {
  // Not URLSearchParams: mail apps would show its "+" instead of spaces.
  const subject = encodeURIComponent(`Offliner v${version} : mon retour`);
  return `mailto:${CONTACT_EMAIL}?subject=${subject}`;
}
