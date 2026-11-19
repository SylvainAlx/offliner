import { useUser } from "../stores/userStore";

export function useVillageCompanions() {
  const user = useUser((state) => state.user);
  const { companions } = user.village;
  const houseLevel = user.village.getBuildingLevel("house");

  return {
    houseLevel,
    companions
  };
}