# 🍳 CookShare — Frontend

> Interface utilisateur React de la plateforme sociale culinaire **CookShare** (ft_transcendence).

---

## Stack Technique

| Outil | Rôle |
|---|---|
| **React 19** | Framework UI |
| **Vite** | Build tool & dev server |
| **TypeScript** | Typage statique |
| **TailwindCSS v4** | Styling utility-first |
| **DaisyUI** | Composants UI pré-stylés |
| **Axios** | Client HTTP avec intercepteurs |
| **Socket.IO Client** | WebSocket temps réel |
| **React Router v7** | Routing SPA |

---

## Architecture

```
frontend/src/
├── App.tsx                    # Routes principales
├── contexts/                  # Providers React (Auth, Chat)
│   ├── auth.context.tsx       # Session utilisateur, JWT, refresh
│   └── chat.context.tsx       # WebSocket lifecycle, unread count
├── hooks/                     # Hooks custom
│   ├── useAuth.ts             # Re-export auth context
│   ├── useChat.ts             # Messagerie complète (API + WS)
│   └── useProfileUpdate.ts   # Mise à jour profil + avatar
├── services/                  # Couche API
│   ├── api.client.ts          # Axios instance + intercepteurs 401
│   ├── auth.service.ts        # POST login/register/logout/refresh/...
│   ├── chat.service.ts        # POST messages, GET messages, unread
│   ├── user.service.ts        # GET/PUT users, upload avatar
│   └── socket.service.ts      # Socket.IO singleton (connect, events)
├── types/                     # Interfaces TypeScript
│   ├── auth.type.ts
│   ├── chat.type.ts
│   └── user.type.ts
├── constants/                 # Constantes endpoints API
│   ├── auth.const.ts
│   ├── chat.const.ts
│   └── user.const.ts
├── pages/                     # Pages/routes
│   ├── HomePage.tsx           # Landing page publique
│   ├── Login.tsx              # Connexion
│   ├── Register.tsx           # Inscription
│   ├── EmailVerify.tsx        # Vérification email
│   ├── ForgetPassword.tsx     # Mot de passe oublié
│   ├── Home.tsx               # Layout principal (navbar + sidebar)
│   ├── Messenger.tsx          # Page messagerie complète
│   ├── Conversation.tsx       # Composant conversation (bridge)
│   ├── ConversationHeader.tsx # En-tête conversation
│   ├── ConversationBody.tsx   # Corps messages
│   ├── ConversationFooter.tsx # Saisie + envoi
│   └── 404.tsx                # Page 404
└── components/                # Composants réutilisables
    ├── Navbar.tsx             # Barre de navigation principale
    ├── Navigation.tsx         # Sidebar navigation
    ├── ProtectedRoute.tsx     # Route guard (auth required)
    ├── PostCard.tsx           # Carte de recette (feed)
    ├── UserMessage.tsx        # Item conversation (sidebar messenger)
    ├── Dropdown/              # Dropdowns navbar
    │   ├── Account.tsx        # Menu compte utilisateur
    │   ├── MessageUI.tsx      # Dropdown messages (unread count)
    │   └── NotificationUI.tsx # Dropdown notifications
    ├── Modal/                 # Modales
    │   ├── ProfilModal.tsx    # Édition profil
    │   ├── DeconnexionModal.tsx
    │   └── NewRecipe.tsx      # Création recette (UI seule)
    ├── Feeds/                 # Composants feed
    │   ├── PostFeed.tsx
    │   ├── FollowersFeed.tsx
    │   ├── FollowingFeed.tsx
    │   └── OwnRecipeFeed.tsx
    └── UI/                    # Composants UI atomiques
        ├── Sender.tsx         # Bulle message envoyé
        ├── recever.tsx        # Bulle message reçu
        ├── FollowerUI.tsx     # Carte follower
        └── ...
```

---

## Routes

### Routes publiques
| Route | Page | Statut |
|---|---|---|
| `/` | Landing page | ✅ Fonctionnel (données locales) |
| `/login` | Connexion | ✅ API réelle |
| `/register` | Inscription | ✅ API réelle |
| `/email-verify` | Vérification email | ⚠️ UI seule (submit non branché) |
| `/forget-password` | Mot de passe oublié | ⚠️ Mockup (données hardcodées) |

### Routes protégées (authentification requise)
| Route | Page | Statut |
|---|---|---|
| `/home/feed` | Feed recettes | ⚠️ Mockup (5 cartes hardcodées) |
| `/home/for-you` | Pour vous | ⚠️ Même composant que feed |
| `/home/followers` | Mes abonnés | ⚠️ Mockup (15 cartes identiques) |
| `/home/followings` | Mes abonnements | ⚠️ Mockup (15 cartes identiques) |
| `/home/my-recipes` | Mes recettes | ⚠️ Mockup (15 cartes identiques) |
| `/messenger/:userId?` | Messagerie | ✅ API + WebSocket temps réel |

---

## Fonctionnalités implémentées

### ✅ Pleinement fonctionnel (API réelle)
- **Authentification** : Login, Register, Logout, Refresh token automatique, Session restore
- **Profil** : Visualisation + édition (username, prénom, nom, email) via modale
- **Messagerie temps réel** : Envoi/réception de messages via REST + Socket.IO, indicateur de frappe, compteur non-lus, liste de conversations dynamique
- **Route guard** : Protection des routes avec redirection
- **Dropdown messages** : Badge non-lus réel + aperçu conversations

### ⚠️ Partiellement implémenté
- **Vérification email** : UI existe mais formulaire non branché à l'API
- **Upload avatar** : Sélection fichier côté client, mais pas d'appel à `userService.updateAvatar()`
- **Création recette** : Formulaire complet (modale 4 étapes) mais aucun handler de soumission

### ❌ Mockup / Données hardcodées (aucune API)
- Feed de recettes, Followers, Following, Mes recettes
- Notifications (dropdown)
- Recherche
- Mot de passe oublié
- Boutons Follow/Unfollow (toggle local uniquement)
- Commentaires, Likes, Favoris

---

## Variables d'environnement

```env
VITE_API_URL=http://localhost:3001     # API Gateway
VITE_WS_URL=http://localhost:3007      # WebSocket Service
```

---

## Commandes

```bash
npm install          # Installer les dépendances
npm run dev          # Serveur de développement (port 5173)
npm run build        # Build production
npm run lint         # Linting ESLint
```

---

## Connexion Backend

| Service | Port | Usage |
|---|---|---|
| API Gateway | 3001 | Toutes les requêtes REST via `/api/v1/` |
| WebSocket Service | 3007 | Connexion Socket.IO directe (auth JWT) |

L'authentification utilise :
- **Access Token** (15min) : stocké en mémoire + localStorage fallback
- **Refresh Token** (7j) : cookie httpOnly, rotation automatique
- **Intercepteur Axios** : retry automatique sur 401 avec file d'attente
