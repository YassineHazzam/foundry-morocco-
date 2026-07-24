# Foundry MLS — plateforme immobilière marocaine (achat / vente)

Node.js + Express + EJS, inspirée de l'UX HotPads, adaptée au marché marocain.
Même stack que le site Yalabs : déployable sur Vercel avec base Neon Postgres.

## Fonctionnalités

**Site public**
- Accueil : recherche, Sélection Foundry, Prix en baisse, Dernières annonces, villes
- Recherche `/recherche` : filtres (ville, quartier, type, prix, chambres, titré, particulier/agence, ✦ Vérifié) + carte Leaflet/OpenStreetMap synchronisée (gratuite, pas de facturation Google)
- Pages SEO programmatiques : `/{ville}/{type}-a-vendre` (ex. `/casablanca/appartement-a-vendre`) et `/ville/{ville}` — générées pour chaque ville × type, avec sitemap.xml
- Fiche annonce `/annonce/{slug}` : galerie, prix MAD, titre foncier, étage/ascenseur, équipements, bouton **WhatsApp**, formulaire de lead, biens similaires
- Dépôt d'annonce `/vendre` → entre dans la file de modération

**Admin** (`/admin`)
- Tableau de bord : stats, file de modération (✦ Vérifier & publier / Publier / Rejeter), top annonces, derniers leads
- Gestion des annonces : CRUD complet, badges Vérifié/Sélection/Prix en baisse
- Boîte de leads acheteurs

## Lancer en local

```bash
npm install
npm start
# http://localhost:3000  —  admin : http://localhost:3000/admin/login
```

Sans base de données configurée, les données sont stockées dans `data/db.json`
(créé automatiquement avec les villes marocaines et 12 annonces de démonstration).

**Admin par défaut : `admin` / `foundry2026`** — à changer via variables d'environnement.

## Déployer sur Vercel + Neon (comme Yalabs)

1. Pousser ce dossier dans un nouveau repo GitHub.
2. Importer le repo dans Vercel.
3. Créer une base Neon et ajouter les variables d'environnement dans Vercel :
   - `STORAGE_DATABASE_URL` — l'URL de connexion Neon
   - `SESSION_SECRET` — une chaîne aléatoire longue
   - `ADMIN_USER` / `ADMIN_PASSWORD` — vos identifiants admin
4. Déployer. Les tables (`listings`, `leads`, `cities`, `admins`) sont créées et
   les données de démonstration insérées automatiquement au premier chargement.

> `vercel.json` inclut `includeFiles: views/**` — c'est ce qui évite le problème
> de page blanche rencontré sur le déploiement Yalabs (les templates EJS ne sont
> pas embarqués par défaut dans les fonctions serverless).

## Structure

```
server.js            Express, sessions, init
lib/store.js         Couche données (Postgres JSONB ↔ JSON local, même API)
lib/seed.js          Villes + quartiers + annonces de démo
routes/site.js       Pages publiques + SEO + leads + sitemap
routes/admin.js      Auth, dashboard, modération, CRUD, leads
views/               Templates EJS (public + admin)
public/css/style.css Système de design tadelakt/zellige (Fraunces + Work Sans)
public/js/map.js     Carte Leaflet synchronisée avec les résultats
```

## Prochaines étapes suggérées

- Upload de photos (Cloudinary ou Vercel Blob)
- Comptes vendeurs avec espace « Mes annonces »
- Favoris + recherches sauvegardées avec alertes email
- Version arabe (RTL) et anglaise des pages SEO
- Volet location (le même moteur avec `transaction: location`)
