import { useVillageCompanions } from "../hooks/useVillageCompanions";
import CompanionTile from "./CompanionTile";
import VillageSection from "./VillageSection";

export default function VillageCompanions() {
  const { houseLevel, companions } = useVillageCompanions();

  return (
    <VillageSection
      title="Vos compagnons"
      subtitle="Votre population utilise les places disponibles dans votre maison."
    >
      {companions.length > 0 ? (
        <ul className="m-0 grid w-full grid-cols-1 list-none gap-2.5 p-0 md:grid-cols-2">
          {companions.map((companion) => (
            <CompanionTile companion={companion} key={companion.id} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-0.75 rounded-xl border border-dashed border-(--gray-200) p-[18px_12px] text-center text-(--gray-600)">
          <span
            className="mb-0.75 text-[1.4rem] text-(--accent)"
            aria-hidden="true"
          >
            ◇
          </span>
          <p className="text-[0.82rem] font-semibold text-(--gray-700)">
            Votre village n&apos;a pas encore de compagnon.
          </p>
          <span className="text-[0.75rem]">
            {houseLevel === 0
              ? "Construisez d'abord une maison."
              : "La première invocation vous attend."}
          </span>
        </div>
      )}
    </VillageSection>
  );
}
