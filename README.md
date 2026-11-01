# Offliner

<p align="center">
  <img src="./public/logo.png" alt="Logo Offliner" width="128" />
</p>

<p align="center">
  <strong>Déconnectez-vous. Faites grandir votre village.</strong>
</p>

Offliner est une progressive web app (PWA) qui transforme le temps passé hors
ligne en progression ludique. Chaque période sans connexion permet de gagner
de l’Offlinium, de construire des maisons et d’invoquer des compagnons pour
faire grandir son village.

Le projet est actuellement un prototype fonctionnel, conçu pour une expérience
prioritairement mobile, mais également utilisable sur ordinateur.

## Origine du projet

Offliner v2 est la seconde version du projet. Une première implémentation avait
initialement été développée en React Native avec Expo dans le dépôt
[offliner](https://github.com/SylvainAlx/offliner-v2).

Cette version explore une approche web installable (PWA), tout en conservant
l’idée centrale de transformer le temps hors ligne en progression dans un
village.

## Fonctionnalités

- suivi automatique du temps passé hors ligne grâce au statut réseau du navigateur ;
- génération d’une particule d’Offlinium toutes les 10 secondes hors ligne ;
- construction de maisons et gestion d’une file d’attente de constructions ;
- invocation, aperçu, interaction et libération de compagnons ;
- évolution des compagnons, de l’enfance jusqu’au stade de sage, puis mort après leur durée de vie hors ligne ;
- profil local avec historique des périodes hors ligne ;
- sauvegarde, export et import des données au format JSON ;
- fonctionnement hors ligne avec installation possible sur l’écran d’accueil ;
- interface responsive et navigation adaptée au mobile.

## Fonctionnement des données

Offliner ne dépend actuellement d’aucun serveur ni compte distant. La
progression est enregistrée dans une base IndexedDB locale, gérée par
[Dexie](https://dexie.org/). Le profil courant est stocké dans la base
`offliner`, dans l’enregistrement `profiles/current`.

La section **Données du compte** permet d’exporter la progression dans un
fichier JSON afin de la conserver ou de la transférer sur un autre appareil.
Ce fichier peut contenir les données de jeu du profil local : conservez-le dans
un emplacement sûr et ne le partagez pas si vous ne souhaitez pas divulguer
votre progression.

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

| Commande       | Description                                                                   |
| -------------- | ----------------------------------------------------------------------------- |
| `pnpm dev`     | Lance le serveur de développement Vite.                                       |
| `pnpm build`   | Vérifie les types TypeScript et génère la version de production dans `dist/`. |
| `pnpm preview` | Sert localement la version générée dans `dist/`.                              |
| `pnpm lint`    | Analyse le code avec Oxlint.                                                  |

Avant de publier une version, il est recommandé d’exécuter :

```bash
pnpm lint
pnpm build
```

## Stack technique

- [React](https://react.dev/) ;
- [TypeScript](https://www.typescriptlang.org/) ;
- [Vite](https://vite.dev/) ;
- [Zustand](https://zustand.docs.pmnd.rs/) pour l’état applicatif ;
- CSS natif ;
- [Dexie](https://dexie.org/) pour la persistance locale IndexedDB ;
- Service worker et Web App Manifest pour le fonctionnement PWA.

## Structure du projet

```text
src/
├── components/   Composants React et mise en page
├── hooks/        Logique réutilisable des écrans et interactions
├── models/       Modèles métier : utilisateur, village, compagnons...
├── services/     Persistance locale
├── stores/       État global Zustand
├── styles/       Feuilles de style de l’application
└── utils/        Constantes et fonctions utilitaires
public/           Service worker, manifeste et ressources statiques
```

## Statut du projet

Le dépôt est public pour permettre la consultation du code et le partage du
projet. Les contributions externes, pull requests et collaborations ne sont
pas ouvertes pour le moment.

## Licence

Aucune licence open source n’est encore définie pour ce projet. La visibilité
publique du dépôt ne constitue pas, à elle seule, une autorisation de copier,
modifier ou redistribuer le code. Une licence pourra être ajoutée ultérieurement.
