import BuildingLocked from "../BuildingLocked";

/** Shown in place of the star system until the spaceport is built. */
export default function SystemLocked({ onGoToPlanet }: { onGoToPlanet: () => void }) {
  return (
    <BuildingLocked
      type="spaceport"
      title="Système planétaire"
      subtitle="Construisez le spatioport pour découvrir les planètes voisines."
      purpose="Le spatioport ouvre l'accès à votre système planétaire et lance les expéditions."
      onGoToPlanet={onGoToPlanet}
    />
  );
}
