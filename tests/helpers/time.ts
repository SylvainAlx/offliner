export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;

/** Local timestamp (the tests run in the Europe/Paris time zone). */
export function local(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
): number {
  return new Date(year, month - 1, day, hour, minute).getTime();
}
