import { useState, type FormEvent } from "react";
import Button from "../ui/Button";
import PlanetSection from "../PlanetSection";
import { useUser } from "../../stores/userStore";
import { MAX_NAME_LENGTH } from "../../utils/constants";

export default function PlanetIdentity() {
  const planetName = useUser((state) => state.user.planet.name);
  const renamePlanet = useUser((state) => state.renamePlanet);
  const [name, setName] = useState(planetName);
  const [isSaved, setIsSaved] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (renamePlanet(trimmedName)) {
      setName(trimmedName);
      setIsSaved(true);
    }
  }

  return (
    <PlanetSection title="Nom de la planète">
      <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="planet-name-input">
          Nom de la planète
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="planet-name-input"
            className="min-h-11 min-w-0 flex-1 rounded-[10px] border border-(--gray-200) bg-white px-3 py-2.5 font-inherit text-[0.9rem] text-(--gray-900) outline-offset-1 focus:outline-2 focus:outline-(--accent-border)"
            type="text"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(event) => {
              setName(event.target.value);
              setIsSaved(false);
            }}
            required
          />
          <Button type="submit" onClick={() => {}}>
            Renommer
          </Button>
        </div>
        {isSaved && (
          <p className="text-[0.8rem] text-(--green-dark)">Planète renommée.</p>
        )}
      </form>
    </PlanetSection>
  );
}
