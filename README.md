# Challenge CardeGall — Frontend

Application React/Vite du Challenge CardeGall — tournoi sportif inter-services Orange
Business.

## Prérequis

- Node.js 20+
- pnpm

## Installation

```bash
pnpm install
```

## Commandes

```bash
pnpm run dev      # Vite HMR → http://localhost:5183
pnpm run build    # TypeScript + Vite bundle → dist/
pnpm run test     # Vitest unit tests
pnpm run lint     # ESLint check
```

## Variables d'environnement

Voir `.env.example` (local), `.env.staging.example` et `.env.production.example`.

```
VITE_API_BASE_URL=http://localhost:3010
```

## CI/CD

- `.github/workflows/ci.yml` : lint + test + build sur chaque Pull Request vers
  `staging` ou `main`.
- `.github/workflows/deploy-staging.yml` : déploiement automatique sur Azure Storage
  (`$web`) à chaque push sur `staging`.
- `.github/workflows/deploy-prod.yml` : déploiement automatique sur Firebase Hosting
  à chaque push sur `main`.

## Environnements

| Environnement | URL |
|---|---|
| Local | http://localhost:5183 |
| Staging | https://stcardegallstg.z6.web.core.windows.net/ |
| Prod | https://challenge-cardegall.web.app |

## Branches

- `feature/*`, `fix/*`, `chore/*` : branches de travail, jamais de commit direct sur
  `staging` ou `main`.
- `staging` : déployé automatiquement en environnement de staging.
- `main` : déployé automatiquement en production.
