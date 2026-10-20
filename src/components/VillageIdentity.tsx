import { useState, type FormEvent } from "react";
import Button from "./ui/Button";
import VillageSection from "./VillageSection";
import { useUser } from "../stores/userStore";

export default function VillageIdentity() {
  const village = useUser((state) => state.user.village);
  const renameVillage = useUser((state) => state.renameVillage);
  const [name, setName] = useState(village.name);
  const [isSaved, setIsSaved] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (renameVillage(trimmedName)) {
      setName(trimmedName);
      setIsSaved(true);
    }
  }

  if (!village.townHall) return null;

  return (
    <VillageSection
      title="Identité du village"
      subtitle="L'hôtel de ville vous permet de personnaliser votre village."
    >
      <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
        <label
          className="text-[0.8rem] font-semibold text-(--gray-700)"
          htmlFor="village-name-input"
        >
          Nom du village
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="village-name-input"
            className="min-h-11 min-w-0 flex-1 rounded-[10px] border border-(--gray-200) bg-white px-3 py-2.5 font-inherit text-[0.9rem] text-(--gray-900) outline-offset-1 focus:outline-2 focus:outline-(--accent-border)"
            type="text"
            value={name}
            maxLength={40}
            onChange={(event) => {
              setName(event.target.value);
              setIsSaved(false);
            }}
            required
          />
          <Button type="submit" onClick={() => {}}>
            Enregistrer
          </Button>
        </div>
        {isSaved && (
          <p className="text-[0.8rem] text-(--green-dark)">
            Nom du village enregistré.
          </p>
        )}
      </form>
    </VillageSection>
  );
}
