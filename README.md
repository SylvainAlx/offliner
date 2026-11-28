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
- **Population.** L’habitat fixe le maximum d’habitants, qui augmente à
  chaque niveau. La population grandit en temps réel, mange de
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
- explorations de l’inconnu : un vaisseau à la fois, qui rapporte du métal, de
  l’Offlinium, une épave, un rescapé ou rien du tout ;
- section Habitants : le chef planétaire et la galerie des habitants mis en
  avant chaque semaine, avec une pastille tant qu’un nouveau venu attend
  son histoire ;
- radar : signaux entre joueurs sans serveur, sous forme de code ou de QR code
  à transmettre par le moyen de son choix, et journal des signaux captés ;
- succès regroupés par catégorie : planète, exploration spatiale, habitants,
  communauté, temps hors ligne, régularité ;
- historique des périodes hors ligne ;
- thème clair, sombre ou automatique (suit le réglage de l’appareil) ;
- sauvegarde, export et import des données au format JSON ;
- section « Contact et soutien » : retours par e-mail, lien vers le code sur GitHub et dons facultatifs par
  PayPal, sans contrepartie dans le jeu (adresse et lien dans
  `src/utils/constants.ts`) ;
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

Le radar échange des signaux entre joueurs sans serveur. Un signal (planète,
auteur, message) devient un code `OFFLINER1.<contenu>.<contrôle>` : le
contenu est du JSON encodé en Base64 « url-safe », et une somme de contrôle
détecte un code abîmé. Le code est aussi proposé en QR code (généré avec
`uqr`). À la réception, un QR code photographié est lu par le lecteur du
navigateur quand il existe, sinon par `jsqr`, chargé à la demande. Le code
est encodé, pas chiffré.

L’application enregistre la partie toutes les 30 secondes lorsqu’elle est
ouverte, à chaque action et à chaque construction terminée. Le choix du thème
est une préférence d’affichage : il est gardé dans le `localStorage` de
l’appareil, hors de la sauvegarde de partie.

La section **Données du compte** permet d’exporter la progression dans un
fichier JSON, pour la conserver ou la transférer sur un autre appareil. Ce
fichier contient vos données de jeu : conservez-le dans un endroit sûr.

## Origine du projet

Offliner a d’abord été développé en React Native avec Expo, dans le dépôt
[offliner-react-native](https://github.com/SylvainAlx/offliner-react-native). Une deuxième version a
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
git clone https://github.com/SylvainAlx/offliner.git
cd offliner
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

## Versions

La version n’est écrite que dans `package.json`. Après la 1.0.0 :

- **correctif** (`1.1.0` → `1.1.1`) : changer la version, rien d’autre ;
- **version mineure ou majeure** (`1.1.1` → `1.2.0` ou `2.0.0`) : changer la
  version et ajouter son entrée dans `src/data/releaseNotes.ts`. Les joueurs la
  voient une fois, dans une fenêtre « Quoi de neuf ? » ; un test échoue si elle
  manque.

Chaque version publiée sur `main` reçoit un tag `vX.Y.Z`.

Le numéro de version de l’application est distinct de `SAVE_VERSION` : ne pas
incrémenter ce dernier sans migration, sous peine d’effacer les parties en
cours.

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
├── data/         Contenus rédigés : notes de version
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
lecture et la revue du code ; il n’accepte pas de contributions (voir
[CONTRIBUTING.md](CONTRIBUTING.md)).

## Licence

© 2026 Sylvain Alexandre. Tous droits réservés.

Offliner n’est pas un logiciel libre. Le code, les textes et les graphismes
sont protégés par le droit d’auteur : vous pouvez les lire et les commenter,
mais pas les copier, les modifier, les redistribuer ni les réutiliser sans
autorisation écrite. Les conditions complètes sont dans le fichier
[LICENSE](LICENSE).
