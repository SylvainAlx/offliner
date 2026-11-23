import type { ReactNode } from "react";
import {
  BASE_STORAGE_CAPACITY,
  BUILDINGS,
  BUILDING_TYPES,
  LABORATORY_BONUS_PER_LEVEL,
  SOLAR_ENERGY_PER_LEVEL,
  STORAGE_CAPACITY_FACTOR,
} from "../models/buildings";
import {
  CARGO_CAPACITY_PER_LEVEL,
  CARGO_FUEL_PER_AU,
  COLONISTS_PER_SHIP,
  COLONIZATION_COST,
  COLONIZATION_FUEL_PER_AU,
  FLIGHT_MS_PER_AU,
  NIGHT_CREDIT_CAP_MS,
  NIGHT_END_HOUR,
  MAX_COLONIES,
  MIN_FLIGHT_MS,
  SPACEPORT_RANGE_AU_PER_LEVEL,
  BASE_FOOD_PER_HOUR,
  BASE_METAL_PER_HOUR,
  FOOD_PER_INHABITANT_PER_HOUR,
  OFFLINIUM_DELIVERY_INTERVAL,
  PLANET_FIELDS,
  SPEED_UP_MS_PER_OFFLINIUM,
  STARTING_POPULATION,
  STARTING_RESOURCES,
  UNOBSERVED_GAP_THRESHOLD_MS,
  UNOBSERVED_OFFLINE_CREDIT_CAP_MS,
} from "../utils/constants";
import Card from "./ui/Card";

const text = "m-0 text-[0.86rem] leading-normal text-(--gray-600)";
const list = "m-0 grid list-none gap-1.5 p-0";
const bullet =
  "relative pl-4 text-[0.86rem] leading-normal text-(--gray-600) before:absolute before:left-0.5 before:top-[0.6em] before:size-1.5 before:rounded-full before:bg-(--accent-border) before:content-['']";

const format = (value: number) => value.toLocaleString("fr-FR");

/** The three ideas to know before anything else. */
const ESSENTIALS = [
  {
    icon: "⬡",
    title: "Hors ligne",
    text: `1 Offlinium toutes les ${OFFLINIUM_DELIVERY_INTERVAL / 1000} s passées sans connexion.`,
  },
  {
    icon: "⏱️",
    title: "En temps réel",
    text: "La planète produit, construit et grandit, même application fermée.",
  },
  {
    icon: "🏗️",
    title: "Construire",
    text: "Métal et Offlinium paient les bâtiments, l'Offlinium accélère les chantiers.",
  },
];

function HelpSection({
  icon,
  title,
  defaultOpen = false,
  children,
}: {
  icon: string;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      className="group rounded-2xl border border-(--gray-200) bg-(--surface) open:border-(--accent-border) open:shadow-(--shadow-sm)"
      open={defaultOpen}
    >
      <summary className="flex min-h-13 cursor-pointer list-none items-center gap-3 rounded-2xl px-3.5 py-2.5 select-none hover:bg-(--gray-50) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent) [&::-webkit-details-marker]:hidden">
        <span
          className="grid size-8.5 shrink-0 place-items-center rounded-[10px] bg-(--gray-50) text-[1.05rem]"
          aria-hidden="true"
        >
          {icon}
        </span>
        <strong className="flex-1 text-[0.92rem] text-(--gray-900)">{title}</strong>
        <span
          className="text-[0.8rem] text-(--gray-500) transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        >
          ▼
        </span>
      </summary>
      <div className="flex flex-col gap-2.5 px-3.5 pt-1 pb-4">{children}</div>
    </details>
  );
}

function HelpGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex w-full flex-col gap-2" aria-label={title}>
      <h3 className="m-0 px-1 text-[0.7rem] font-black tracking-widest text-(--gray-500) uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function Help() {
  return (
    <Card ariaLabel="Aide et informations" title="Aide" subtitle="Comment fonctionne Offliner ?">
      <section className="w-full" aria-label="L'essentiel">
        <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0 max-sm:grid-cols-1">
          {ESSENTIALS.map((item) => (
            <li
              key={item.title}
              className="flex flex-col gap-1 rounded-2xl border border-(--accent-border) bg-(--accent-bg) p-3 max-sm:flex-row max-sm:items-center max-sm:gap-3"
            >
              <span className="text-[1.3rem] leading-none" aria-hidden="true">
                {item.icon}
              </span>
              <span>
                <strong className="block text-[0.85rem] text-(--gray-900)">{item.title}</strong>
                <span className="block text-[0.76rem] leading-snug text-(--gray-600)">
                  {item.text}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <HelpGroup title="Les bases">
        <HelpSection icon="🚀" title="Bien démarrer" defaultOpen>
          <p className={text}>
            Vous arrivez sur une planète vierge de {PLANET_FIELDS} cases avec{" "}
            {format(STARTING_RESOURCES.metal)} de métal,{" "}
            {format(STARTING_RESOURCES.food)} d&apos;alimentation,{" "}
            {format(STARTING_RESOURCES.offlinium)} d&apos;Offlinium et{" "}
            {STARTING_POPULATION} habitants. Un ordre qui fonctionne bien :
          </p>
          <ol className="m-0 grid list-decimal gap-1.5 pl-5 marker:font-bold marker:text-(--accent) text-[0.86rem] leading-normal text-(--gray-600)">
            <li>la mine de métal, pour ne plus manquer de matériaux ;</li>
            <li>le réacteur, dès que l&apos;énergie passe dans le rouge ;</li>
            <li>la ferme, avant que la population ne dépasse la production ;</li>
            <li>l&apos;habitat, pour loger plus de monde et faire tourner les bâtiments ;</li>
            <li>le dépôt, quand le métal ou l&apos;alimentation plafonnent.</li>
          </ol>
          <p className={text}>
            Le bilan de la page Planète signale en clair ce qui bloque :
            énergie, personnel, famine ou dépôt plein.
          </p>
        </HelpSection>

        <HelpSection icon="⏱️" title="Deux horloges">
          <ul className={list}>
            <li className={bullet}>
              <strong>Le temps réel</strong> fait tourner la planète en
              permanence, application ouverte ou fermée : constructions,
              production de métal et d&apos;alimentation, croissance de la
              population.
            </li>
            <li className={bullet}>
              <strong>Le temps hors ligne</strong> ne sert qu&apos;à une chose :
              produire l&apos;Offlinium.
            </li>
          </ul>
        </HelpSection>

        <HelpSection icon="⬡" title="L'Offlinium">
          <ul className={list}>
            <li className={bullet}>
              1 particule toutes les {OFFLINIUM_DELIVERY_INTERVAL / 1000} secondes
              passées hors ligne, soit {format(3600_000 / OFFLINIUM_DELIVERY_INTERVAL)}{" "}
              par heure.
            </li>
            <li className={bullet}>
              Le laboratoire augmente ce gain de{" "}
              {Math.round(LABORATORY_BONUS_PER_LEVEL * 100)} % par niveau.
            </li>
            <li className={bullet}>
              Il n&apos;est jamais plafonné par le dépôt.
            </li>
            <li className={bullet}>
              La nuit, entre minuit et {NIGHT_END_HOUR} h, seules{" "}
              {NIGHT_CREDIT_CAP_MS / 3600000} h hors ligne sont comptées au
              maximum : laisser son téléphone hors ligne toute la nuit ne
              rapporte pas plus.
            </li>
          </ul>
          <p className={text}>
            Pour tester, activez le mode avion, coupez le Wi-Fi ou utilisez
            l&apos;onglet Réseau (Network → Offline) de vos outils de
            développement.
          </p>
          <p className="m-0 rounded-xl bg-(--gray-50) p-3 text-[0.8rem] leading-normal text-(--gray-600)">
            <strong>Application fermée ?</strong> Elle ne peut alors pas
            vérifier votre connexion. Après plus de{" "}
            {UNOBSERVED_GAP_THRESHOLD_MS / 60000} minutes sans pouvoir le faire,
            elle vous demande à votre retour si vous êtes resté hors ligne : ce
            temps n&apos;est compté que si vous répondez oui, dans la limite de{" "}
            {UNOBSERVED_OFFLINE_CREDIT_CAP_MS / 3600000} h par absence.
          </p>
        </HelpSection>

        <HelpSection icon="🏗️" title="Constructions">
          <ul className={list}>
            <li className={bullet}>Une seule construction à la fois.</li>
            <li className={bullet}>
              Chaque niveau occupe une case de la planète et coûte du métal et
              de l&apos;Offlinium. Plus il coûte cher, plus il est long.
            </li>
            <li className={bullet}>
              Accélérer coûte 1 ⬡ par {SPEED_UP_MS_PER_OFFLINIUM / 1000} secondes
              gagnées : une heure hors ligne paie une heure de construction.
            </li>
            <li className={bullet}>Annuler rembourse tout le coût.</li>
          </ul>
          <p className={text}>
            En vue Surface, touchez un bâtiment pour le construire ou
            l&apos;améliorer ; la flèche verte signale ceux que vous pouvez
            améliorer tout de suite.
          </p>
        </HelpSection>
      </HelpGroup>

      <HelpGroup title="Votre planète">
        <HelpSection icon="🏭" title="Les bâtiments">
          <ul className={list}>
            {BUILDING_TYPES.map((type) => (
              <li key={type} className="flex gap-2.5 text-[0.84rem] leading-snug text-(--gray-600)">
                <span className="w-6 shrink-0 text-center text-[1rem]" aria-hidden="true">
                  {BUILDINGS[type].icon}
                </span>
                <span>
                  <strong className="text-(--gray-900)">{BUILDINGS[type].label}</strong> —{" "}
                  {BUILDINGS[type].description}
                </span>
              </li>
            ))}
          </ul>
        </HelpSection>

        <HelpSection icon="⚡" title="Énergie et personnel">
          <ul className={list}>
            <li className={bullet}>
              Les bâtiments consomment de l&apos;énergie. Le réacteur la
              produit, et chaque niveau construit ajoute{" "}
              {SOLAR_ENERGY_PER_LEVEL} d&apos;énergie solaire.
            </li>
            <li className={bullet}>
              Ils ont aussi besoin d&apos;habitants pour tourner (sauf
              l&apos;habitat).
            </li>
            <li className={bullet}>
              S&apos;il manque de l&apos;énergie ou du personnel, toute la
              production ralentit dans la même proportion.
            </li>
            <li className={bullet}>
              Sans aucun bâtiment, la planète produit tout de même{" "}
              {BASE_METAL_PER_HOUR} de métal et {BASE_FOOD_PER_HOUR}{" "}
              d&apos;alimentation par heure.
            </li>
          </ul>
        </HelpSection>

        <HelpSection icon="📦" title="Stockage">
          <p className={text}>
            Le métal et l&apos;alimentation sont stockés dans le dépôt : sans
            lui, chacun plafonne à {format(BASE_STORAGE_CAPACITY)}, et chaque
            niveau multiplie la capacité par{" "}
            {STORAGE_CAPACITY_FACTOR.toLocaleString("fr-FR")}. Au-delà, ce qui est
            produit est perdu. L&apos;Offlinium n&apos;est jamais plafonné.
          </p>
        </HelpSection>

        <HelpSection icon="👥" title="Population">
          <ul className={list}>
            <li className={bullet}>
              L&apos;habitat fixe le nombre maximum d&apos;habitants : campement,
              village, ville au niveau 6, puis mégalopole au niveau 11.
            </li>
            <li className={bullet}>
              Tant qu&apos;il reste de la place et de quoi manger, la population
              grandit en temps réel.
            </li>
            <li className={bullet}>
              Chaque habitant mange {FOOD_PER_INHABITANT_PER_HOUR} unité
              d&apos;alimentation par heure : sans ferme suffisante, la
              population finit par diminuer.
            </li>
          </ul>
        </HelpSection>
      </HelpGroup>

      <HelpGroup title="Au-delà">
        <HelpSection icon="👑" title="Habitants célèbres">
          <p className={text}>
            Un chef planétaire guide votre colonie dès le premier jour. Ensuite,
            chaque semaine passée sur la planète, un nouvel habitant se
            distingue. Retrouvez-les dans l&apos;onglet Habitants pour leur
            donner un nom, un titre et une histoire. Une pastille verte signale
            ceux qui attendent encore la leur.
          </p>
        </HelpSection>

        <HelpSection icon="☀️" title="Système planétaire">
          <p className={text}>
            Le spatioport ouvre l&apos;onglet Système, qui présente les planètes
            voisines : distance, température et cases disponibles.
          </p>
        </HelpSection>

        <HelpSection icon="🚀" title="Expéditions et colonies">
          <ul className={list}>
            <li className={bullet}>
              Chaque niveau de spatioport porte{" "}
              {SPACEPORT_RANGE_AU_PER_LEVEL.toLocaleString("fr-FR")} UA plus loin,
              depuis sa planète. Les planètes hors de portée sont estompées sur la
              carte.
            </li>
            <li className={bullet}>
              <strong>Colonisation</strong> : {format(COLONIZATION_COST.metal)} de
              métal, {format(COLONIZATION_COST.food)} d&apos;alimentation,{" "}
              {COLONISTS_PER_SHIP} colons et {COLONIZATION_FUEL_PER_AU} ⬡ de
              carburant par UA. La colonie démarre avec ses colons, un petit stock
              et son propre gouverneur. {MAX_COLONIES} colonies au maximum, en
              plus de votre planète de départ.
            </li>
            <li className={bullet}>
              <strong>Cargo</strong> : transporte du métal et de
              l&apos;alimentation vers une de vos planètes, jusqu&apos;à{" "}
              {format(CARGO_CAPACITY_PER_LEVEL)} unités par niveau de spatioport,
              pour {CARGO_FUEL_PER_AU} ⬡ par UA.
            </li>
            <li className={bullet}>
              Le vol dure {FLIGHT_MS_PER_AU / 3600000} h par UA (
              {MIN_FLIGHT_MS / 60000} min au minimum), en temps réel.
            </li>
            <li className={bullet}>
              Chaque planète a ses propres réserves, sa population et son
              chantier ; l&apos;Offlinium est commun. Passez de l&apos;une à
              l&apos;autre avec le sélecteur au-dessus des ressources.
            </li>
          </ul>
        </HelpSection>

        <HelpSection icon="💾" title="Vos données">
          <ul className={list}>
            <li className={bullet}>Pas de compte ni de serveur : tout reste sur votre appareil.</li>
            <li className={bullet}>La partie est sauvegardée automatiquement.</li>
            <li className={bullet}>
              Depuis l&apos;onglet Compte, exportez une sauvegarde pour la garder
              ou la transférer sur un autre appareil.
            </li>
          </ul>
        </HelpSection>
      </HelpGroup>
    </Card>
  );
}
