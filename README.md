# architecture_microservice_projet

Application de benchmarking de librairies de deep learning (PyTorch et Keras) sur les datasets CIFAR-100 et Fashion-MNIST.

## Lancement

```
docker-compose up -d --build
```

L'application est accessible sur http://localhost

## Comptes preexistants

Admins :
- admin1@projet.com / Admin1234!
- admin2@projet.com / Admin1234!

Utilisateurs :
- user1@projet.com / User1234!
- user2@projet.com / User1234!
- user3@projet.com / User1234!

Note : la confirmation d'email doit etre desactivee dans les parametres Supabase pour que les comptes soient utilisables directement.

## Architecture

- Frontend : React (Vite) servi par Nginx sur le port 80
- Backend : FastAPI (port 8000, accessible uniquement en interne via Nginx)
- Message broker : Kafka
- Base de donnees : Supabase (PostgreSQL)
- Training : 4 conteneurs (PyTorch + Keras sur CIFAR-100 et Fashion-MNIST)

## Schema d'architecture

```
[Navigateur]
     |
   port 80
     |
[Nginx / Frontend]
     |
  /api/ proxy
     |
[Backend FastAPI]
     |
  Kafka consumer
     |
[Kafka]
     |
[Training containers x4]
```
