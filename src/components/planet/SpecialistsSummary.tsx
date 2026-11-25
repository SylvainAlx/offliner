import type { Colony } from "../../models/colony";
import {
  SPECIALTIES,
  SPECIALTY_TYPES,
  describeSpecialtyBonus,
} from "../../models/specialty";

/** The notable inhabitants' bonuses on a planet. */
export default function SpecialistsSummary({ colony }: { colony: Colony }) {
  const present = SPECIALTY_TYPES.filter((type) => colony.specialists[type] > 0);

  return (
    <div className="rounded-lg border border-(--accent-border) bg-(--accent-bg) px-2.5 py-2 text-[0.76rem] text-(--gray-800)">
      <strong className="block text-(--gray-900)">Spécialistes sur cette planète</strong>
      {present.length === 0 ? (
        <p className="m-0 mt-1 text-(--gray-600)">
          Aucun pour l&apos;instant. Chaque habitant célèbre de la semaine a une
          spécialité : envoyez-en ici depuis sa fiche pour profiter de son bonus.
        </p>
      ) : (
        <ul className="m-0 mt-1 grid list-none gap-0.5 p-0">
          {present.map((type) => (
            <li key={type}>
              {SPECIALTIES[type].icon} {SPECIALTIES[type].label}
              {colony.specialists[type] > 1 ? ` ×${colony.specialists[type]}` : ""} :{" "}
              {describeSpecialtyBonus(type, colony.specialists[type])}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
