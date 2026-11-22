# Offliner

<p align="center">
  <img src="./public/icons/logo.svg" alt="Logo Offliner" width="128" />
</p>

<p align="center">
  <strong>Déconnectez-vous. Bâtissez votre planète.</strong>
</p>

Offliner est un jeu de gestion de planète en solo, inspiré des jeux par
navigateur comme OGame, sous forme de progressive web app (PWA). Les bâtiments
se construisent et produisent en temps réel, tandis que l’Offlinium, la
ressource qui fait tout avancer plus vite, ne se gagne qu’en restant hors
ligne.

Le jeu est pensé d’abord pour le mobile, où il s’installe comme une
application, et reste utilisable sur ordinateur. Tout fonctionne sur
l’appareil : pas de serveur, pas de compte, pas de classement.

## Le jeu en bref

Chaque partie commence sur une planète vierge de 163 cases, avec un nom et
une apparence générés au hasard, 10 colons et quelques ressources.

- **Deux horloges.** Le temps réel fait tourner la planète en permanence,
  application ouverte ou fermée : constructions, production, population. Le
  temps hors ligne, lui, ne produit que de l’Offlinium.
- **Ressources.** Le métal et l’alimentation sont produits en temps réel et
  plafonnés par le dépôt. L’Offlinium (360 par heure hors ligne au rythme de
  base) n’est jamais plafonné. L’énergie est un bilan : produite moins
  consommée.
- **Bâtiments.** Mine de métal, ferme, réacteur, dépôt, laboratoire et habitat.
  Chaque niveau coûte plus cher que le précédent, occupe une case et prend un
  temps réel proportionnel à son coût. Une seule construction à la fois.
- **Accélération.** L’Offlinium permet de terminer une construction plus tôt,
  à raison d’1 Offlinium pour 10 secondes gagnées.
- **Énergie et personnel.** Les bâtiments consomment de l’énergie et ont
  besoin d’habitants pour tourner. S’il en manque, ils tournent au ralenti,
  dans la même proportion, comme dans OGame.
- **Population.** L’habitat fixe le maximum d’habitants (campement, village,
  ville, puis mégalopole). La population grandit en temps réel, mange de
  l’alimentation, et diminue en cas de famine.
- **Habitants célèbres.** Un chef planétaire guide la colonie dès le premier
  jour, puis un nouvel habitant se distingue chaque semaine. Le joueur leur
  donne un nom, un titre et une histoire.

Les règles chiffrées sont regroupées dans `src/models/buildings.ts` et
`src/utils/constants.ts`.

## Fonctionnalités

- suivi automatique du temps passé hors ligne grâce au statut réseau du
  navigateur, avec confirmation des absences que l’application n’a pas pu
  observer (plafonnées à 12 h) ;
- économie en temps réel rattrapée à chaque ouverture, minute par minute ;
- six bâtiments à niveaux, avec tableau détaillé des prochains niveaux ;
- accélération et annulation (remboursement complet) de la construction en
  cours ;
- bilan de la planète et explications sur la population, avec alertes en clair
  (énergie, personnel, famine, dépôt plein) ;
- planète et bâtiments en pixel art générés en code : la planète dépend d’une
  graine aléatoire, et les bâtiments changent d’apparence avec leur niveau et
  le type de planète ;
- expéditions de colonisation et de cargo depuis le spatioport, avec portée,
  temps de vol en temps réel et sélecteur de planète ;
- section Habitants : le chef planétaire et la galerie des habitants mis en
  avant chaque semaine, avec une pastille tant qu’un nouveau venu attend
  son histoire ;
- succès regroupés par catégorie : planète, temps hors ligne, régularité ;
- historique des périodes hors ligne ;
- thème clair, sombre ou automatique (suit le réglage de l’appareil) ;
- sauvegarde, export et import des données au format JSON ;
- fonctionnement hors ligne et installation sur l’écran d’accueil.

## Fonctionnement des données

La progression est enregistrée dans une base IndexedDB locale, gérée par
[Dexie](https://dexie.org/) : la base `offliner-v1`, enregistrement
`profiles/current`.

La partie est organisée pour accueillir plusieurs planètes : le joueur
(`User`) possède l’Offlinium, les habitants célèbres et une liste de
colonies (`Colony`). Chaque colonie a sa planète, son chantier, son métal,
son alimentation et sa population, et toutes avancent sur la même horloge
temps réel. Les sauvegardes portent un numéro de version (`SAVE_VERSION`) :
une sauvegarde d’une autre version n’est pas chargée, et la partie repart de
zéro.

Depuis l’onglet Système, le spatioport lance des expéditions : colonisation
d’une planète libre (3 colonies au maximum) ou cargo de métal et
d’alimentation vers une de vos planètes. Chaque niveau de spatioport porte
0,5 UA plus loin et ajoute 2 000 unités de capacité au cargo ; le carburant
se paie en Offlinium. Les vaisseaux sont sous-entendus : on ne les construit
pas, leur prix fait partie de celui de l’expédition.

L’application enregistre la partie toutes les 30 secondes lorsqu’elle est
ouverte, à chaque action et à chaque construction terminée. Le choix du thème
est une préférence d’affichage : il est gardé dans le `localStorage` de
l’appareil, hors de la sauvegarde de partie.

La section **Données du compte** permet d’exporter la progression dans un
fichier JSON, pour la conserver ou la transférer sur un autre appareil. Ce
fichier contient vos données de jeu : conservez-le dans un endroit sûr.

## Origine du projet

Offliner a d’abord été développé en React Native avec Expo, dans le dépôt
[offliner](https://github.com/SylvainAlx/offliner-v2). Une deuxième version a
exploré une approche web installable (PWA) autour d’un village et de
compagnons à faire évoluer.

La version actuelle (v1 du jeu de planète) repart de cette base technique,
notamment le suivi du temps hors ligne, et la transforme en jeu de gestion à
la manière d’OGame. Le document de conception décrit les règles et les
étapes de développement.

## Prérequis

- Node.js récent ;
- pnpm.

## Installation et développement

```bash
git clone <URL_DU_DEPOT>
cd offliner-v2
pnpm install
pnpm dev
```

L’application est ensuite accessible à l’adresse indiquée par Vite, en général
`http://localhost:5173`.

## Scripts disponibles

| Commande          | Description                                                                   |
| ----------------- | ----------------------------------------------------------------------------- |
| `pnpm dev`        | Lance le serveur de développement Vite.                                       |
| `pnpm build`      | Vérifie les types TypeScript et génère la version de production dans `dist/`. |
| `pnpm preview`    | Sert localement la version générée dans `dist/`.                              |
| `pnpm lint`       | Analyse le code avec Oxlint.                                                  |
| `pnpm test`       | Lance une fois la suite de tests Vitest.                                      |
| `pnpm test:watch` | Relance les tests à chaque modification.                                      |
| `pnpm check`      | Enchaîne lint, tests et build : à lancer avant de pousser.                    |

## Tests

Les tests utilisent [Vitest](https://vitest.dev/) et s’exécutent dans Node,
dans le fuseau horaire `Europe/Paris` (fixé par `vitest.config.ts`) afin que les
changements de jour et d’heure d’été soient vérifiés de façon reproductible.

Tous les tests sont rassemblés dans `tests/`, qui reprend l’organisation de
`src/` :

- `tests/models/` : logique de jeu. Périodes hors ligne et plafond du temps non
  observé, bâtiments et leurs courbes, économie (énergie, personnel,
  alimentation, dépôt, population), constructions et accélération, Offlinium,
  dessins de la planète et des bâtiments, succès, validation des sauvegardes ;
- `tests/stores/` : store utilisateur (mise à jour chaque seconde,
  enregistrements, ordre des écritures, import, réinitialisation) ;
- `tests/pwa/` : service worker (`public/sw.js`) exécuté dans un environnement
  simulé, et plugin de build `vite-plugins/offlinerServiceWorker.ts` ;
- `tests/services/` et `tests/stores/installStore.test.ts` : détection de
  l’appareil et gestion de l’invite d’installation ;
- `tests/deployment/` : configuration Vercel (`vercel.json`) ;
- `tests/helpers/` : utilitaires partagés par les tests.

Leurs types sont vérifiés par `tsconfig.test.json` lors de `pnpm build`.

## Déploiement

L’application est déployée sur Vercel. `vercel.json` remplace la commande de
build du projet par `pnpm test && pnpm build` : un test en échec bloque donc la
mise en ligne. Ce fichier définit aussi les en-têtes HTTP de sécurité
(Content-Security-Policy, `nosniff`, interdiction d’intégration dans une iframe)
et la mise en cache : fichiers de `assets/` conservés indéfiniment (leur nom
change à chaque build), `sw.js` jamais mis en cache.

La Content-Security-Policy interdit les scripts écrits directement dans
`index.html` : tout code doit passer par les modules de `src/`.

## Stack technique

- [React](https://react.dev/) 19, avec le React Compiler ;
- [TypeScript](https://www.typescriptlang.org/) ;
- [Vite](https://vite.dev/) ;
- [Tailwind CSS](https://tailwindcss.com/) 4, avec des variables CSS pour les
  couleurs : le thème sombre redéfinit ces variables dans
  `src/styles/index.css` ;
- [Zustand](https://zustand.docs.pmnd.rs/) pour l’état applicatif ;
- [Dexie](https://dexie.org/) pour la persistance locale IndexedDB ;
- service worker et Web App Manifest pour le fonctionnement PWA.

## Structure du projet

```text
src/
├── components/   Composants React et mise en page
│   ├── home/     Illustration de la page d’accueil
│   ├── inhabitants/ Habitants célèbres
│   ├── planet/   Écran de la planète : bâtiments, construction, population, bilan
│   └── system/   Système planétaire
├── hooks/        Logique réutilisable des écrans et interactions
├── models/       Logique de jeu : joueur, colonies, planète, bâtiments, économie, périodes hors ligne, succès
├── services/     Persistance locale
├── stores/       État global Zustand (partie, connexion, installation, thème)
├── styles/       Feuille de style et variables de thème
└── utils/        Constantes, dessins pixel art, thème et fonctions utilitaires
public/           Service worker, manifeste et ressources statiques
tests/            Tests Vitest, organisés comme src/
```

## Statut du projet

Le projet est en développement actif. Le dépôt est public pour permettre la
consultation du code et le partage du projet. Les contributions externes, pull
requests et collaborations ne sont pas ouvertes pour le moment.

## Licence

Aucune licence open source n’est encore définie pour ce projet. La visibilité
publique du dépôt ne constitue pas, à elle seule, une autorisation de copier,
modifier ou redistribuer le code. Une licence pourra être ajoutée ultérieurement.
