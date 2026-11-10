import {
  COMPANIONS_PER_HOUSE,
  COMPANION_STAGE_AGE_MS,
  HOUSE_CONSTRUCTION_COST,
  TOWN_HALL_CONSTRUCTION_COST,
  OFFLINIUM_DELIVERY_INTERVAL,
  UNOBSERVED_GAP_THRESHOLD_MS,
  UNOBSERVED_OFFLINE_CREDIT_CAP_MS,
} from "../utils/constants";
import Card from "./ui/Card";

export default function Help() {
  return (
    <Card
      ariaLabel="Aide et informations"
      title="Aide"
      subtitle="Comment fonctionne Offliner ?"
    >
      <p className="mb-2.5 text-[0.9rem] leading-normal text-(--gray-600) last:mb-0">
        <strong>
          1 particule d'Offlinium (⬡) est générée toutes les{" "}
          {OFFLINIUM_DELIVERY_INTERVAL / 1000} secondes que vous passez hors
          ligne.
        </strong>
      </p>
      <p className="mb-2.5 text-[0.9rem] leading-normal text-(--gray-600) last:mb-0">
        Pour tester, activez le mode avion, coupez le Wi-Fi ou utilisez l'onglet
        Réseau (Network → Offline) de vos outils de développement.
      </p>
      <p className="mb-2.5 text-[0.9rem] leading-normal text-(--gray-600) last:mb-0">
        Lorsque l&apos;application est fermée ou en arrière-plan, elle ne peut
        pas vérifier votre connexion. Après plus de{" "}
        {UNOBSERVED_GAP_THRESHOLD_MS / 60000} minutes sans pouvoir le faire,
        elle vous demande à votre retour si vous êtes resté hors ligne : ce
        temps n&apos;est compté que si vous répondez oui, dans la limite de{" "}
        {UNOBSERVED_OFFLINE_CREDIT_CAP_MS / 3600000} h par absence.
      </p>
      <p className="mb-2.5 text-[0.9rem] leading-normal text-(--gray-600) last:mb-0">
        Les maisons se construisent avec {HOUSE_CONSTRUCTION_COST} ⬡ et
        permettent d&apos;accueillir chacune {COMPANIONS_PER_HOUSE} compagnons.
        Votre capacité maximale augmente lorsque la construction est terminée,
        et le compteur du bouton indique le nombre de maisons construites.
      </p>
      <p className="mb-2.5 text-[0.9rem] leading-normal text-(--gray-600) last:mb-0">
        L’hôtel de ville coûte {TOWN_HALL_CONSTRUCTION_COST} ⬡ et ne peut être
        construit qu’une seule fois. Il débloque le nom du village et le
        renommage des compagnons.
      </p>
      <p className="mb-2.5 text-[0.9rem] leading-normal text-(--gray-600) last:mb-0">
        Chaque compagnon commence enfant et évolue automatiquement selon son
        temps de vie hors ligne : adolescent après{" "}
        {COMPANION_STAGE_AGE_MS.adolescent / 3600000} h, adulte après{" "}
        {COMPANION_STAGE_AGE_MS.adult / 3600000} h, puis sage après{" "}
        {COMPANION_STAGE_AGE_MS.sage / 3600000} h. Il meurt après{" "}
        {COMPANION_STAGE_AGE_MS.dead / 3600000} h hors ligne cumulées.
      </p>
      <p className="mb-2.5 text-[0.9rem] leading-normal text-(--gray-600) last:mb-0">
        Les compagnons évolués accélèrent la récolte : un adolescent ajoute +1
        ⬡, un adulte +2 ⬡ et un sage +3 ⬡ à chaque tranche de{" "}
        {OFFLINIUM_DELIVERY_INTERVAL / 1000} secondes hors ligne, à partir du
        moment où ils atteignent ce stade.
      </p>
    </Card>
  );
}
