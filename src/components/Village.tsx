import Card from "./ui/Card";
import { useVillage } from "../hooks/useVillage";
import { useUser } from "../stores/userStore";
import VillageCompanions from "./VillageCompanions";
import VillageConstructions from "./VillageConstructions";
import VillageIdentity from "./VillageIdentity";

export default function Village() {
  const { isOnline } = useVillage();
  const villageName = useUser((state) => state.user.village.name);

  return (
    <Card
      ariaLabel="Village"
      title={villageName === "Village sans nom" ? "Village" : villageName}
      subtitle={
        isOnline
          ? "Coupez internet pour développer votre village."
          : "Profitez de ce temps hors ligne pour développer votre village."
      }
    >
      <VillageIdentity />
      <VillageConstructions />
      <VillageCompanions />
    </Card>
  );
}
