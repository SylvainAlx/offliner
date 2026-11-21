import {
  FOOD_PER_INHABITANT_PER_HOUR,
  OFFLINIUM_DELIVERY_INTERVAL,
  PLANET_FIELDS,
  SPEED_UP_MS_PER_OFFLINIUM,
  UNOBSERVED_GAP_THRESHOLD_MS,
  UNOBSERVED_OFFLINE_CREDIT_CAP_MS,
} from "../utils/constants";
import Card from "./ui/Card";

const paragraph = "mb-2.5 text-[0.9rem] leading-normal text-(--gray-600) last:mb-0";

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
      <p className={paragraph}>
        Le temps réel fait tourner la planète en permanence, application
        ouverte ou fermée : constructions, production de métal et
        d&apos;alimentation, croissance de la population. L&apos;Offlinium,
        lui, ne se gagne qu&apos;hors ligne.
      </p>
      <p className={paragraph}>
        Une seule construction à la fois. Chaque niveau occupe une case de la
        planète ({PLANET_FIELDS} cases) et coûte du métal et de
        l&apos;Offlinium. La durée dépend du coût. Annuler rembourse tout.
      </p>
      <p className={paragraph}>
        L&apos;Offlinium permet aussi de terminer une construction plus tôt :{" "}
        1 ⬡ par {SPEED_UP_MS_PER_OFFLINIUM / 1000} secondes gagnées. Une heure
        hors ligne au rythme de base paie donc une heure de construction.
      </p>
      <p className={paragraph}>
        Les bâtiments consomment de l&apos;énergie et ont besoin de personnel.
        S&apos;il en manque, ils tournent au ralenti, dans la même proportion.
        Le réacteur produit l&apos;énergie, et chaque niveau construit ajoute
        des panneaux solaires.
      </p>
      <p className={paragraph}>
        L&apos;habitat loge les habitants : village, ville au niveau 6, puis
        mégalopole au niveau 11. Chaque habitant mange{" "}
        {FOOD_PER_INHABITANT_PER_HOUR} unité d&apos;alimentation par heure : sans
        ferme suffisante, la population finit par diminuer.
      </p>
    </Card>
  );
}
