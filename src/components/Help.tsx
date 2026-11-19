import {
  COMPANIONS_PER_HOUSE,
  COMPANION_STAGE_AGE_MS,
  OFFLINIUM_DELIVERY_INTERVAL,
  UNOBSERVED_GAP_THRESHOLD_MS,
  UNOBSERVED_OFFLINE_CREDIT_CAP_MS,
} from "../utils/constants";
import Card from "./ui/Card";
import { BUILDINGS, getBuildingCost } from "../models/building";
import { formatResources } from "../models/resources";

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
        Les bâtiments ont des niveaux. Chaque niveau coûte plus cher et prend
        plus de temps que le précédent, et tout se construit pendant votre
        temps hors ligne, dans une seule file d&apos;attente.
      </p>
      <p className="mb-2.5 text-[0.9rem] leading-normal text-(--gray-600) last:mb-0">
        La maison (niveau 1 : {formatResources(getBuildingCost("house", 1))})
        accueille {COMPANIONS_PER_HOUSE} compagnons par niveau. À partir du
        niveau 3, elle demande aussi des matériaux.
      </p>
      <p className="mb-2.5 text-[0.9rem] leading-normal text-(--gray-600) last:mb-0">
        L’hôtel de ville coûte {formatResources(getBuildingCost("townHall", 1))}{" "}
        et ne se construit qu’une fois. Il débloque le nom du village, le
        renommage des compagnons et les bâtiments de production :{" "}
        {BUILDINGS.well.label.toLowerCase()}, qui ajoute de l&apos;Offlinium à
        chaque récolte, et {BUILDINGS.quarry.label.toLowerCase()}, qui extrait
        des matériaux.
      </p>
      <p className="mb-2.5 text-[0.9rem] leading-normal text-(--gray-600) last:mb-0">
        Annuler une construction rembourse tout ce qu&apos;elle a coûté. Annuler
        un niveau annule aussi les niveaux suivants du même bâtiment déjà en
        file.
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
