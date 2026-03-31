# architecture_microservice_projet

Application de benchmarking de librairies de deep learning (PyTorch et Keras) sur les datasets CIFAR-100 et Fashion-MNIST.

Le but c'est de comparer les performances des deux libs sur deux datasets differents, et d'afficher les resultats en temps reel sur un dashboard.

## Prerequis

- Docker + Docker Compose
- Un projet Supabase (il faut creer un `.env` dans `/backend` avec `SUPABASE_URL` et `SUPABASE_KEY`)

## Lancement

```bash
docker-compose up -d --build
```

L'application est accessible sur http://localhost

Le premier lancement peut etre un peu long vu que les images de training doivent telecharger les datasets + les dependances pytorch/keras.

Pour voir les logs si jamais :
```bash
docker-compose logs -f
```

## Comptes preexistants

Les comptes sont seed automatiquement au lancement (via `seed.py`).

Admins :
- admin1@projet.com / Admin1234!
- admin2@projet.com / Admin1234!

Utilisateurs :
- user1@projet.com / User1234!
- user2@projet.com / User1234!
- user3@projet.com / User1234!

Les admins ont acces aux metriques systeme (CPU/RAM) en plus du reste.

## Stack technique

- **Frontend** : React (Vite) + Recharts pour les graphes, servi par Nginx
- **Backend** : FastAPI (Python)
- **Message broker** : Kafka
- **Base de donnees** : Supabase (PostgreSQL)
- **Training** : 4 conteneurs Docker (PyTorch + Keras sur CIFAR-100 et Fashion-MNIST)
- **Auth** : JWT via Supabase

## Architecture

En gros : le frontend (React) est servi par Nginx sur le port 80. Nginx proxy les appels `/api/` vers le backend FastAPI. Les 4 conteneurs de training publient leurs metriques sur Kafka, et le backend les consomme pour les rendre dispo via l'API. Le dashboard poll toutes les 5s.

```
Navigateur -> Nginx(:80) -> Backend FastAPI -> Kafka -> 4x Training containers
```

## API

- `POST /api/auth/register` - inscription
- `POST /api/auth/login` - login (retourne un JWT)
- `GET /api/training/metrics` - metriques par epoch
- `GET /api/training/metrics/summary` - resume
- `GET /api/training/metrics/system` - cpu/ram (admin only)
