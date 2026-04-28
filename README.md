*This project has been created as part of the 42 curriculum by rdiary, mranaivo, arazafin, tambinin, candriam.*

---

## Description

**CookShare** is a **high-fidelity social culinary platform** that redefines how we cook, eat, and connect. Much more than a recipe repository, it is a fully gamified ecosystem where culinary creativity meets real-time collaboration.

### The Objective

Developed as the capstone project (**ft_transcendence**) for the 42 curriculum, CookShare is built to solve the **fragmentation of the modern digital kitchen**. Our mission is to unify the workflow, gamify the experience, and showcase engineering excellence through a production-grade microservices architecture.

### Key Features

- **Premium Frontend Excellence**: State-of-the-Art UI built with React 19, featuring Lottie animations and responsive design.
- **AI-Driven Curation**: Integrated Retrieval-Augmented Generation (RAG) providing intelligent recipe assistance.
- **Precision Meal Orchestration**: Advanced meal planner and calendar interface for nutrition management.
- **Smart Shopping Assistant**: Real-time collaborative shopping lists synchronized via WebSockets.
- **Social & Competitive Dynamics**: Full social graph, real-time chat, and a logic-driven Gamification Engine (XP/Badges).
- **Observability Stack**: Professional monitoring via ELK Stack (Elasticsearch, Logstash, Kibana), Prometheus, and Grafana.

---

## Team Information

| Member | Role(s) | Responsibilities |
| :--- | :--- | :--- |
| **rdiary** | Product Owner, Dev | Vision, feature prioritization, RAG LLM implementation. |
| **mranaivo** | Tech Lead, Dev | Technical architecture, frontend development, database design. |
| **candriam** | Project Manager, Dev | Coordination, backend development, database design. |
| **arazafin** | Developer | Infrastructure, security, and containerization. |
| **tambinin** | Developer | Infrastructure, security, and cybersecurity modules. |

---

## Project Management

- **Organization**: Agile/Scrum methodology with weekly tactical meetings and daily coordination.
- **Workflow**: Task distribution via feature-based ownership and collaborative code reviews.
- **Tools**: **GitHub Issues** for task tracking and status monitoring.
- **Communication**: **Slack** for real-time discussion, documentation sharing, and incident management.

---

## Technical Stack

- **Frontend**: **React 19** with **TypeScript** and **Vite**. State management via **Zustand** and data fetching with **TanStack Query**. Styling using **TailwindCSS 4** and **DaisyUI**.
- **Backend**: **Fastify** (Node.js) with **TypeScript**. Microservices architecture for modularity and scalability.
- **Database**: **PostgreSQL** hosted on **Supabase**. Chosen for its robust relational capabilities, cloud scalability, and seamless integration with our microservices via **Prisma ORM**.
- **Infrastructure**: **Docker & Podman** for containerization. **HashiCorp Vault** for enterprise-grade secret management. **ModSecurity (WAF)** for security. **ELK Stack** and **Prometheus/Grafana** for observability.

---

## Technology Choices & Justification

### Frontend

| Technology | Why we chose it |
| :--- | :--- |
| **React 19** | Component-based architecture with the latest concurrent rendering features. Massive ecosystem, first-class TypeScript support, and the team's existing expertise made it the most productive choice for a complex, interactive UI. |
| **TypeScript** | Catches type errors at compile time across the entire frontend, making refactoring safer and improving collaboration in a 5-person team. |
| **Vite** | Significantly faster dev server startup and HMR than Create React App or Webpack. Native ESM support and optimised production builds via Rollup. |
| **TailwindCSS 4 + DaisyUI** | Utility-first CSS eliminates context switching between stylesheets and components. DaisyUI provides accessible, themeable component primitives that keep the design consistent without a heavy UI library. |
| **Lottie** | High-fidelity vector animations at near-zero bundle cost compared to GIF or video assets, used on auth pages and loading states. |

### Backend

| Technology | Why we chose it |
| :--- | :--- |
| **Fastify** | Fastest Node.js HTTP framework benchmarked (2–3× Express throughput). Built-in schema-based validation (JSON Schema / Zod), structured logging via Pino, and a plugin system that scales cleanly with microservices. |
| **Node.js** | Asynchronous, non-blocking I/O is perfectly suited to a platform with many simultaneous WebSocket connections and inter-service HTTP calls. Unified language (TypeScript) across frontend and backend reduces context switching. |
| **Microservices architecture** | Each service owns a single bounded context (auth, users, recipes, chat, notifications, WebSocket). Services can be scaled, deployed, and debugged independently. Aligns with the DevOps module requirements. |
| **Socket.IO + Redis adapter** | Socket.IO provides WebSocket with automatic fallback and room management. The Redis adapter enables horizontal scaling across multiple instances and message buffering for reconnecting clients. |
| **Python / FastAPI (RAG service)** | The AI/ML ecosystem (LangChain, FAISS, HuggingFace) is Python-native. FastAPI provides async request handling and automatic OpenAPI docs, matching our Node.js gateway architecture. |

### Database

| Technology | Why we chose it |
| :--- | :--- |
| **PostgreSQL** | ACID-compliant relational database with native support for JSON columns, full-text search, and rich indexing strategies. The complex social graph (follows, friends, blocks) and recipe relations benefit from foreign key constraints and transactional integrity. |
| **Prisma ORM** | Type-safe query builder that generates a strongly-typed client from the schema, eliminating runtime SQL errors. Migration system keeps schema changes versioned and reproducible. |
| **Supabase** | Managed PostgreSQL hosting with automatic backups, connection pooling (PgBouncer), and a real-time layer. Removes operational overhead of self-hosting a database while keeping full SQL access. |

### Infrastructure & Security

| Technology | Why we chose it |
| :--- | :--- |
| **Docker / Podman** | Containerisation guarantees identical environments across developer machines and CI. Podman is daemonless and rootless, improving the security profile for production. A single `make` command spins up the entire 15-container stack. |
| **HashiCorp Vault** | Industry-standard secrets management. Vault Agent sidecars inject secrets at runtime — no credentials are ever stored in the repository or in `.env` files. Dynamic secret rotation is available for future use. |
| **ModSecurity / WAF (OWASP CRS)** | Application-layer firewall that inspects every HTTP request before it reaches a backend service. The OWASP Core Rule Set provides protection against OWASP Top 10 attacks (SQLi, XSS, path traversal) with minimal false-positive configuration. |
| **ELK Stack** | Centralised log aggregation across all microservices. Kibana enables log search and dashboarding without SSH access to containers — essential for debugging a distributed system. |
| **Prometheus + Grafana** | De-facto standard for metrics collection and visualisation. Prometheus pull-model scrapes are lightweight; Grafana dashboards give instant visibility into service latency, error rates, and system resources. |
| **Cloudinary** | Managed media CDN with on-the-fly image transformation (resize, crop, format conversion). Offloads storage I/O from the application servers and delivers optimised images globally via CDN edge nodes. |

---

## Instructions

### Prerequisites

To compile and run this project, you must have the following tools installed with the specified minimum versions:

- **Container Engine:** Podman (default) or Docker (v24.0.0 or higher).
- **Orchestration:** podman-compose or docker-compose (v2.0.0 or higher).
- **Runtime:** Node.js (v24.x or higher) and npm (v10.x or higher).
- **Automation:** GNU Make (v4.3 or higher).

### Resource Requirements

To run this project smoothly, ensure your machine meets the following minimum specifications:

| Resource | Minimum Requirement |
|----------|---------------------|
| **RAM** | 10 GB (10240 MB) |
| **CPU** | 10 cores |
| **Storage (ROM)** | 40 GB |

### Automated Security Configuration

This project utilizes **HashiCorp Vault** for centralized, enterprise-grade secret management.

- **Zero-Config Deployment:** All necessary secrets (Database URLs, API Keys, JWT Secrets) are automatically initialized and distributed by the Vault Agent sidecars during the boot sequence.
- **No .env Required:** You do **not** need to create or manage a local `.env` file for the core infrastructure deployment.

### Step-by-Step Execution

The entire microservices architecture is orchestrated via a **Makefile**. Follow these steps to launch and manage the system:

#### 1. Launch the system

Before starting, ensure all prerequisites are met and verify you are in the project root directory:

```bash
cd /path/to/ft_transcendence
```

> **Note:** If this is your first deployment, ensure you have:
> - Copied the PDF files to the RAG service directory ( backend/rag-service/pdfs/ )
> - Copied the SSL certificates to the cybersecurity directory ( cybersecurity/certs/ )
> - Created the required `.env` files in their respective directories (or use the automatic generation script)

Launch the complete system with:

```bash
make
```

This command will:
- Initialize log directories
- Set up TLS certificates
- Decrypt secrets via SOPS
- Start all 15+ containers (Backend microservices, Frontend, Vault, ELK Stack, Monitoring)

#### 2. Verify Deployment

After starting the system, wait a few moments for all services to initialize and health checks to pass. Verify the deployment status:

```bash
make status
```

This displays the domain and current state of all containers.

#### 3. Access Points

Once deployed, the following services are available:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | `https://cookshare.me` | Main web application |
| **API Documentation** | `https://cookshare.me/api/v1/documentation` | Swagger UI via API Gateway |
| **Log Analysis** | `https://kibana.cookshare.me` | Kibana for centralized logging |
| **System Metrics** | `https://grafana.cookshare.me` | Grafana dashboards |

#### 4. Stopping the System

To stop all running containers without removing volumes:

```bash
make stop
```

To stop and remove all containers:

```bash
make clean
```

To perform a full cleanup (stop containers, remove volumes, and delete node_modules):

```bash
make fclean
```

## Database Schema

CookShare utilizes a **multi-schema architecture** on a single PostgreSQL instance to ensure data isolation while maintaining relational integrity.

| Schema | Responsibility | Key Tables |
| :--- | :--- | :--- |
| **`auth_service`** | Identity & Session | `RefreshToken` |
| **`user_service`** | Profiles & Social | `User`, `Follow`, `FriendRequest`, `Badge` |
| **`recipe_service`** | Content & Planning | `Recipe`, `Ingredient`, `Collection`, `MealPlan`, `ShoppingList` |
| **`chat_service`** | Communication | `Conversation`, `Message` |
| **`notification_service`** | Activity Logs | `Notification` |

---


#### 5. Frontend Module Architecture

The frontend follows a **layered architecture** separating routing, UI, state management, data fetching, and API communication into distinct, feature-scoped folders.

```
frontend/src/
│
├── main.tsx                        # Application entry point — mounts React root
├── App.tsx                         # Root router + global context providers
│
├── pages/                          # Route-level page components (one file = one route)
│   ├── Home.tsx                    # Main feed (ForYou / Friends tabs)
│   ├── HomePage.tsx                # Public landing page (unauthenticated)
│   ├── Login.tsx                   # Sign-in form — JWT + Google OAuth2
│   ├── Register.tsx                # Account creation form
│   ├── OAuthCallback.tsx           # Google OAuth2 redirect handler → stores JWT
│   ├── EmailVerify.tsx             # Email verification landing
│   ├── ResetPassword.tsx           # Password reset with token
│   ├── Messenger.tsx               # Conversation list (inbox)
│   ├── Conversation.tsx            # Single conversation view
│   │   ├── ConversationHeader.tsx  # Recipient info + actions
│   │   ├── ConversationBody.tsx    # Message thread
│   │   └── ConversationFooter.tsx  # Message input + send
│   ├── Profile/                    # User profile page
│   │   ├── index.tsx               # Profile root (avatar, stats, tabs)
│   │   ├── ProfileIdentity.tsx     # Name, bio, follow button
│   │   ├── ProfileActions.tsx      # Follow / Friend / Block controls
│   │   ├── ProfileTabs.tsx         # Recipes / Collections / Liked tabs
│   │   ├── ProfileSkeleton.tsx     # Loading skeleton
│   │   └── useProfile.ts           # Profile-specific data fetching hook
│   ├── Recipe/                     # Recipe detail page
│   │   ├── index.tsx               # Recipe root layout
│   │   ├── RecipeHero.tsx          # Cover image + title
│   │   ├── RecipeHeader.tsx        # Author, date, difficulty badge
│   │   ├── RecipeInstructions.tsx  # Step-by-step instructions
│   │   ├── RecipeSidebar.tsx       # Ingredients, dietary tags, actions
│   │   ├── RecipeWidgets.tsx       # Rating, save to collection, meal plan
│   │   ├── RecipeComments.tsx      # Comment thread
│   │   ├── RecipeReview.tsx        # Submit a rating + review
│   │   ├── RecipeSkeleton.tsx      # Loading skeleton
│   │   ├── recipe.utils.ts         # Format helpers (duration, difficulty label)
│   │   └── useRecipePage.ts        # Recipe page data fetching hook
│   └── Settings/                   # Account settings (multi-section)
│       ├── index.tsx               # Settings layout + navigation
│       ├── SettingsProfile.tsx     # Edit name, bio, avatar
│       ├── SettingsSecurity.tsx    # Change password, 2FA, linked accounts
│       ├── SettingsBlocked.tsx     # Blocked users management
│       ├── SettingsDanger.tsx      # Delete account (GDPR)
│       ├── SettingsSection.tsx     # Reusable section wrapper
│       ├── SettingsToast.tsx       # Success/error feedback toast
│       └── useSettings.ts          # Settings form logic + API calls
│
├── components/                     # Reusable UI components
│   ├── PostCard/                   # Recipe card — responsive (3 breakpoints)
│   │   ├── index.tsx               # Entry point (picks variant by screen size)
│   │   ├── PostCardDesktop.tsx
│   │   ├── PostCardTablet.tsx
│   │   ├── PostCardMobile.tsx
│   │   ├── PostCardImage.tsx       # Optimised image with fallback
│   │   ├── PostCardAuthor.tsx      # Avatar + username + follow button
│   │   ├── PostCardMeta.tsx        # Duration, difficulty, rating
│   │   ├── PostCardActions.tsx     # Like, save, share, report
│   │   ├── PostCardComments.tsx    # Inline comment preview
│   │   ├── postCard.types.ts       # Shared PostCard prop types
│   │   └── postCard.utils.ts       # Action handlers
│   ├── Feeds/                      # Feed variants displayed on Home
│   │   ├── ForYouFeed.tsx          # Personalised recommendation feed
│   │   ├── FriendsFeed.tsx         # Recipes from followed users
│   │   ├── PostFeed.tsx            # Generic paginated recipe list
│   │   ├── OwnRecipeFeed.tsx       # Authenticated user's own recipes
│   │   ├── CollectionFeed.tsx      # Saved collections
│   │   ├── MealPlanFeed.tsx        # Weekly meal planner
│   │   ├── ShoppingListFeed.tsx    # Shopping list items
│   │   ├── InvitationFeed.tsx      # Pending friend requests
│   │   └── RecipeFilterBar.tsx     # Category / dietary tag / sort filters
│   ├── Modal/                      # Dialog overlays
│   │   ├── NewRecipe.tsx           # Create recipe wizard
│   │   ├── EditRecipeModal.tsx     # Edit existing recipe
│   │   ├── RecipeModal.tsx         # Quick-view recipe preview
│   │   ├── InstrutionModal.tsx     # Full-screen step view
│   │   ├── ProfilModal.tsx         # Mini profile card popup
│   │   ├── AddMealPlan.tsx         # Add recipe to meal plan
│   │   ├── SaveToCollectionModal.tsx  # Save recipe to collection
│   │   ├── ReportModal.tsx         # Report recipe / comment
│   │   ├── Settings.tsx            # Settings shortcut modal
│   │   └── DeconnexionModal.tsx    # Sign-out confirmation
│   ├── Search/                     # Search system
│   │   ├── index.tsx               # Search root (input + results panel)
│   │   ├── SearchInput.tsx         # Debounced text input
│   │   ├── SearchResults.tsx       # Recipes + users results list
│   │   ├── SearchTabs.tsx          # Switch between Recipes / Users tabs
│   │   ├── SearchHistory.tsx       # Recent local search history
│   │   ├── search.types.ts         # Search result types
│   │   └── useSearch.ts            # Search logic + debounce hook
│   ├── Auth/                       # Authentication UI components
│   │   └── (login form, OAuth button, password strength…)
│   ├── ChatBot/                    # AI assistant (RAG)
│   │   ├── ChatBot.tsx             # Chat panel — sends queries to RAG service
│   │   └── CookShareLogo.tsx       # Animated logo for the assistant
│   ├── Dropdown/                   # Navbar overlay panels
│   │   ├── NotificationUI.tsx      # Notification dropdown panel
│   │   ├── NotificationLine.tsx    # Single notification item
│   │   ├── MessageUI.tsx           # Message dropdown panel
│   │   ├── MessageLine.tsx         # Single message preview
│   │   └── Account.tsx             # User account menu
│   ├── input/                      # Controlled form input primitives
│   │   ├── RecipeNameInput.tsx
│   │   ├── DescriptionInput.tsx
│   │   ├── IngredientInput.tsx
│   │   ├── StepInput.tsx
│   │   ├── TagInput.tsx
│   │   ├── PictureInput.tsx
│   │   └── Fileselect.tsx
│   ├── UI/                         # Generic atomic components
│   │   ├── InputFloating.tsx       # Floating-label text field
│   │   ├── UserAvatar.tsx          # Avatar with online indicator
│   │   ├── FriendUI.tsx            # Friend list item
│   │   ├── FindBar.tsx             # Inline user search bar
│   │   ├── ProfilMessageUI.tsx     # Message thread header
│   │   ├── Sender.tsx / recever.tsx  # Chat bubble variants
│   │   ├── MessageOption.tsx       # Message context menu
│   │   └── returnBtn.tsx           # Back navigation button
│   ├── Navbar.tsx                  # Top navigation bar (notifications, search, account)
│   ├── Navigation.tsx              # Sidebar / bottom nav layout
│   ├── OnlineAvatar.tsx            # Avatar with real-time online badge
│   ├── WsStatusBadge.tsx           # WebSocket connection status indicator
│   ├── RecipeUI.tsx                # Compact recipe card (category badge, rating)
│   ├── ProtectedRoute.tsx          # Route guard — redirects unauthenticated users
│   └── PublicRoute.tsx             # Route guard — redirects authenticated users
│
├── contexts/                       # Global state via React Context API
│   ├── auth.context.tsx            # Authenticated user, JWT tokens, login/logout
│   ├── chat.context.tsx            # Active conversations, unread count
│   ├── notification.context.tsx    # In-app notifications, unread badge
│   ├── feed.context.tsx            # Feed state (active tab, scroll position)
│   ├── recipe.context.tsx          # Recipe creation / edit state
│   ├── favorite.context.tsx        # Liked recipes (optimistic updates)
│   ├── follow.context.tsx          # Follow relationships
│   └── shoppingList.context.tsx    # Shopping list items
│
├── hooks/                          # Custom React hooks
│   ├── useAuth.ts                  # Login, register, logout, token refresh
│   ├── useWebSocket.ts             # Socket.IO connection lifecycle + auto-reconnect
│   ├── useChat.ts                  # Send / receive messages, read receipts
│   ├── useNotification.ts          # Mark as read, notification count
│   ├── useRecipes.ts               # Recipe list fetching (feed, search, profile)
│   ├── useRecipe.ts                # Single recipe fetch + actions
│   ├── useSocial.ts                # Follow / unfollow / friend requests / block
│   ├── useCollections.ts           # Create, update, delete recipe collections
│   ├── useShoppingList.ts          # Add / remove shopping list items
│   ├── useSettings.ts              # Profile & security settings forms
│   ├── usePostCard.ts              # Like, save, report, share actions
│   ├── useProfileUpdate.ts         # Avatar upload + profile edit
│   ├── useSessionWatcher.ts        # Detects JWT expiry → triggers silent refresh
│   └── useMediaQuery.ts            # Responsive breakpoint detection
│
├── services/                       # API layer — Axios clients, one file per domain
│   ├── api.client.ts               # Axios instance — base URL, auth interceptor,
│   │                               #   auto-refresh on 401, request timeout
│   ├── auth.service.ts             # login, register, refresh, logout, OAuth2
│   ├── recipe.service.ts           # CRUD recipes, ratings, comments, search
│   ├── user.service.ts             # Profile, follow, friends, GDPR export
│   ├── chat.service.ts             # Conversations, message history
│   ├── social.service.ts           # Follow feed, friend requests, block
│   ├── notification.service.ts     # Fetch & mark notifications
│   ├── collection.service.ts       # Recipe collections
│   ├── mealplan.service.ts         # Meal planner CRUD
│   ├── shopping.service.ts         # Shopping list CRUD
│   ├── report.service.ts           # Content reporting
│   ├── rag.service.ts              # AI chatbot — sends query to RAG service
│   ├── socket.service.ts           # Socket.IO singleton + event emitters
│   └── url-resolver.ts             # Resolves API base URL from env
│
├── types/                          # Shared TypeScript interfaces & enums
│   ├── auth.type.ts                # LoginPayload, AuthUser, TokenResponse
│   ├── recipe.type.ts              # Recipe, Ingredient, Comment, Rating
│   ├── user.type.ts                # User, FriendRequest, Follow
│   ├── chat.type.ts                # Conversation, Message
│   ├── notification.type.ts        # Notification, NotificationType
│   ├── social.type.ts              # FollowStatus, FriendStatus
│   ├── collection.type.ts          # Collection, CollectionRecipe
│   ├── mealplan.type.ts            # MealPlan, MealType
│   ├── report.type.ts              # Report, ReportReason
│   └── api.type.ts                 # Generic ApiResponse<T>, PaginatedResponse<T>
│
├── constants/                      # Static config values per domain
│   ├── auth.const.ts
│   ├── recipe.const.ts
│   ├── chat.const.ts
│   ├── social.const.ts
│   ├── notification.const.ts
│   ├── collection.const.ts
│   ├── mealplan.const.ts
│   ├── report.const.ts
│   └── user.const.ts
│
└── utils/                          # Pure utility functions
    ├── avatar.utils.ts             # Avatar URL resolution + fallback
    ├── logger.ts                   # Browser-side logger (dev only)
    ├── navigation.utils.ts         # Route helpers
    └── search-history.utils.ts     # LocalStorage search history
```

#### 6. Data Flow Overview

```
User interaction
      │
      ▼
  Page / Component
      │  calls
      ▼
  Custom Hook  (useRecipes, useAuth…)
      │  reads/writes
      ▼
  React Context  (global state)
      │  triggers
      ▼
  Service layer  (recipe.service.ts…)
      │  HTTP via
      ▼
  api.client.ts  (Axios + JWT interceptor)
      │
      ▼
  API Gateway :3001  →  Microservice
```

### HMR (Hot Module Replacement)

- Vite HMR runs over **WSS on port 443** via the path `/__vite_hmr`
- nginx proxies `/__vite_hmr` → `ws://front-end:5173` (WebSocket upgrade)
- No dedicated HMR port exposed (port 24678 removed)

---

#### 7. Security Layer (WAF + TLS)

### ModSecurity + nginx

```
Container: modsecurity (owasp/modsecurity-crs:4-nginx-alpine)
Port: 443:8443
```

| Parameter | Value |
|---|---|
| **Mode** | SecRuleEngine On (active blocking) |
| **Paranoia Level** | 2 (inbound + outbound) |
| **Anomaly Score Inbound** | >= 5 → block |
| **Anomaly Score Outbound** | >= 4 → block |
| **TLS** | 1.2 / 1.3 only |
| **HTTP/2** | Enabled |

### Custom Rules (99-custom.conf)

| ID | Threat | Action |
|---|---|---|
| 1001 | Spam in user content | Deny 403 |
| 1002 | Admin path access (/wp-admin, /.env…) | Deny 403 |
| 1003 | Non-image file upload | Deny 403 |
| 1004 | Missing User-Agent | Deny 403 |
| 1005 | Vulnerability scanner (sqlmap, nikto…) | Deny 403 |
| 1006 | SQLi on search parameter | Deny 403 |
| 1007 | XSS in comment | Deny 403 |
| 1009 | Whitelist /api/auth, /health | Pass (skip API key check) |
| 1012 | LDAP Injection | Deny 403 |
| 1013 | XXE (XML External Entity) | Deny 403 |
| 1014 | SSRF (internal IPs in parameters) | Deny 403 |
| 1015 | SSRF cloud metadata (169.254.169.254) | Deny 403 |
| 1016 | HTTP Request Smuggling (Transfer-Encoding) | Deny 403 |
| 1017 | Double Content-Length | Deny 403 |
| 1018 | Invalid HTTP protocol | Deny 403 |
| 1019 | Dangerous URI extensions (.php, .sh…) | Deny 403 |
| 1020 | Suspicious headers (proxy, x-original-url…) | Deny 403 |
| 1022 | Forbidden methods (TRACE, CONNECT, PATCH…) | Deny 403 |
| 1023 | Session fixation | Deny 403 |
| 1024 | JSON Prototype Pollution | Deny 403 |
| 1025 | NoSQL Injection ($where, $ne…) | Deny 403 |
| 1026 | Open Redirect | Deny 403 |
| 1027 | Credentials in query string | Deny 403 |
| 1028 | Request body > 1 MB (excluding uploads) | Deny 413 |
| 1008 | API call without Bearer token or x-gateway-api-key | Deny 401 |

### CRS Exclusions (RESPONSE-999-EXCLUSION-RULES-AFTER-CRS.conf)

| CRS Rule | Reason for exclusion |
|---|---|
| 930120 | .profile in ARGS:scope OAuth2 (LFI false positive) |
| 931130 | https://www.googleapis.com in ARGS:scope (RFI false positive) |
| 931130 | https://accounts.google.com in ARGS:iss (RFI false positive) |
| 930121 | Referer header containing the OAuth callback URL |
| 941320 | HTML tags in recipe title/description fields |
| 942131 | SQL-like content in bio/first name (false positive) |
| 942380 | "order by" in culinary descriptions |
| 932236 | "Chef" in bio detected as shell injection |

### Injected Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
```

---

#### 8. API Gateway Layer

```
Container: api-gateway   Port: 3001 (internal HTTPS)
Framework: Fastify + @fastify/http-proxy
```

### Responsibilities

- **Single entry point** for all clients (frontend, Swagger, external services)
- **JWT authentication**: verifies Bearer token on all protected routes
- **Rate limiting**: via Redis (sliding window per IP + per userId)
- **Proxy**: routes requests to internal microservices
- **Documentation**: Swagger UI at /api/v1/documentation
- **API Key validation**: verifies x-gateway-api-key for service-to-service calls

### Exposed Proxy Routes

| Prefix | Target | Auth |
|---|---|---|
| GET /api/health | internal health check | public |
| POST /api/v1/auth/* | auth-service:3003 | public |
| GET /api/v1/recipes/* | recipe-service:3002 | public (GET) / JWT (POST/PUT/DELETE) |
| GET /api/v1/categories | recipe-service:3002 | public |
| GET /api/v1/dietary-tags | recipe-service:3002 | public |
| * /api/v1/users/* | user-service:3004 | JWT required |
| * /api/v1/chat/* | chat-service:3005 | JWT required |
| * /api/v1/notifications/* | notification-service:3006 | JWT required |
| GET /api/v1/gdpr/* | user-service:3004 | JWT required |
| * /api/v1/ingredients/* | recipe-service:3002 | JWT required |

---

#### 9. Backend Microservices

All services share:
- **Runtime**: Node.js 24 Alpine
- **Framework**: Fastify 5
- **HTTPS**: self-signed internal TLS (certificates mounted via volume)
- **Shared library**: @transcendence/common (local shared package)
- **ORM**: Prisma 6 with per-service generated client
- **Secrets**: injected from Vault via vault-agent (read-only mounted .env)
- **Logs**: Pino JSON → Logstash → Elasticsearch
- **Metrics**: /metrics Prometheus endpoint

### @transcendence/common — Shared Library

```
backend/common/src/
├── config/           # validateEnv() — Zod schema for environment variables
├── middleware/
│   ├── auth.middleware.ts     # JWT verification for Fastify
│   ├── apikey.middleware.ts   # x-gateway-api-key verification
│   ├── admin.middleware.ts    # RBAC admin guard
│   └── validate.middleware.ts # Zod body validation
├── utils/
│   ├── logger.util.ts         # Pino config (JSON + ELK)
│   ├── metrics.util.ts        # Prometheus (prom-client)
│   ├── redis.util.ts          # Redis client (ioredis)
│   ├── rate-limiter.util.ts   # Redis sliding window rate limiter
│   ├── password.util.ts       # bcrypt hash/compare
│   ├── sanitize.util.ts       # Input sanitisation
│   ├── email.util.ts          # Deep email validation
│   ├── rbac.util.ts           # Role-Based Access Control
│   └── fetch.util.ts          # Internal fetch with timeout
├── types/
│   ├── user.types.ts          # UserRole, AuthProvider
│   ├── notification.types.ts
│   ├── http-status.enum.ts
│   └── api-response.types.ts
└── error/
    ├── index.ts               # NotFoundError, UnauthorizedError…
    └── prisma-error-handler.ts
```

### auth-service — :3003

**Responsibility**: authentication, sessions, Google OAuth2, token management

| Endpoint | Description |
|---|---|
| POST /auth/register | Registration (email + multipart avatar) |
| POST /auth/login | Sign in → access + refresh tokens |
| POST /auth/refresh | Renew access token |
| POST /auth/logout | Revoke refresh token |
| POST /auth/forgot-password | Send password reset email |
| POST /auth/reset-password | Reset with token |
| POST /auth/verify-email | Email verification |
| POST /auth/resend-verification | Resend verification email |
| GET /auth/google | Google OAuth2 redirect |
| GET /auth/google/callback | OAuth2 callback → JWT |
| POST /auth/google/unlink | Unlink Google account |

**DB Schema** (auth_service):

| Model | Description |
|---|---|
| RefreshToken | Stored refresh tokens |

> Verification and reset tokens are stored in the user_service database.

### user-service — :3004

**Responsibility**: profiles, social graph (friends/follow/block), gamification, GDPR

| Controller | Endpoints |
|---|---|
| profile.controller | CRUD profile, Cloudinary avatar, search, user list |
| friend.controller | Friend requests, accept, delete |
| gamification.controller | XP, level, badges, leaderboard |

**DB Schema** (user_service):

| Model | Description |
|---|---|
| User | Full profile (email, username, avatar, XP, level, role) |
| Follow | following/followers relationship |
| FriendRequest | Friend requests (PENDING/ACCEPTED/REJECTED) |
| Block | Blocked users |
| Badge | Available badges (slug, criteria) |
| UserBadge | Badges earned by a user |
| PasswordResetToken | Reset tokens |
| EmailVerificationToken | Email verification tokens |
| AccountDeletionToken | Account deletion tokens (GDPR) |

**Gamification**:
- XP awarded on: RECIPE_CREATED, REVIEW_GIVEN, FIRST_LOGIN, FOLLOWER_GAINED
- Level formula: floor(sqrt(xp / 100)) + 1
- Badges by criteria: RECIPE_COUNT, REVIEW_COUNT, FOLLOWER_COUNT

### recipe-service — :3002

**Responsibility**: recipes, ingredients, comments, collections, meal plans, shopping lists, search, recommendations

**DB Schema** (recipe_service):

| Model | Description |
|---|---|
| Recipe | Recipe (title, slug, description, difficulty, time) |
| Category | Categories (with icon and colour) |
| RecipeIngredient | Recipe ingredients |
| Instruction | Preparation steps |
| RecipeImage | Images (hosted on Cloudinary) |
| DietaryTag | Dietary tags (vegan, gluten-free…) |
| Rating | Ratings (1-5 stars) |
| Comment | Comments (nested, likes) |
| Favorite | User's favourite recipes |
| Collection | Recipe collections (playlists) |
| CollectionRecipe | Collection-recipe association |
| ShoppingListItem | Shopping list items |
| MealPlan | Weekly meal plan |
| Report | Content reports (recipe/comment) |
| UserInteraction | View/click history (recommendation engine) |

**Internal services**:
- cloudinary.service.ts — image upload/deletion
- recommendation.service.ts — suggestions based on UserInteraction
- search.service.ts — PostgreSQL full-text search
- gamification.ts — notifies user-service via internal API

### chat-service — :3005

**Responsibility**: private messaging, conversations, history

**DB Schema** (chat_service):

| Model | Description |
|---|---|
| Conversation | Conversation between 2 users |
| ConversationParticipant | Conversation members |
| Message | Text message (read/unread status) |

- Notifies websocket-service in real-time via internal HTTP

### notification-service — :3006

**Responsibility**: in-app push notifications + transactional emails

**DB Schema** (notification_service):

| Model | Description |
|---|---|
| Notification | Notification (type, read, userId, JSON metadata) |

**Notification types**:
NEW_MESSAGE · FRIEND_REQUEST · FRIEND_ACCEPTED · NEW_FOLLOWER · RECIPE_LIKED · RECIPE_COMMENTED · SYSTEM

- Sends emails via email.service.ts (configurable SMTP)
- Real-time push via websocket-service

---

#### 10. Data Models (Prisma)

Each service has its own **logical PostgreSQL database** (dedicated schema in a shared instance) with an independently generated Prisma client.

```
PostgreSQL (single instance, multi-schema)
├── auth_service          → RefreshToken
├── user_service          → User, Follow, FriendRequest, Block, Badge, UserBadge, *Token
├── recipe_service        → Recipe, Category, Ingredient, Rating, Comment, Favorite…
├── chat_service          → Conversation, ConversationParticipant, Message
└── notification_service  → Notification
```

> The websocket-service uses Redis as its sole storage (no Prisma).

---

#### 11. WebSocket Service (Real-time)

```
Container: websocket   Port: 3007 (internal HTTPS/WSS)
Library: Socket.IO 4 + Fastify
```

### Internal Architecture

```
websocket-service/src/ws/
├── ws.plugin.ts        # Socket.IO initialisation on Fastify HTTPS server
├── ws.adapter.ts       # Redis adapter (pub/sub multi-instance, optional)
├── ws.auth.ts          # JWT middleware at connection + periodic verification
├── ws.handler.ts       # Client event handlers (join, message, typing…)
├── ws.heartbeat.ts     # Ping/pong, silent disconnect detection
├── ws.logger.ts        # Structured Pino logger per module
├── ws.ratelimit.ts     # Redis rate limiting per userId
├── ws.redis.ts         # Redis client (ioredis) + pub/sub
├── ws.rooms.ts         # Room management (conversations, presence)
├── ws.shutdown.ts      # Graceful shutdown (drain connections)
└── ws.types.ts         # AuthenticatedSocket (socket + userId + isAlive)
```

### WebSocket Connection Flow

```
Client Browser
    │
    │ WSS wss://cookshare.me/ws/socket.io/
    │
    ▼
ModSecurity WAF (nginx)
    │ proxy_pass websocket:3007
    │ Upgrade: websocket
    ▼
websocket-service (Socket.IO)
    │
    ├─ ws.auth.ts → jwt.verify(token) → socket.userId
    ├─ ws.ratelimit.ts → Redis INCR (10 events/s max)
    ├─ ws.heartbeat.ts → ping every 25s
    └─ ws.handler.ts
         ├─ join_conversation → ws.rooms.ts
         ├─ send_message → chat-service (internal HTTP)
         ├─ user_typing → broadcast room
         └─ mark_read → notification-service
```

### Mid-session Authentication

The JWT token is verified **at connection** and **every 60 seconds** during the session. If the token expires, the connection is cleanly terminated.

### Redis Adapter (optional)

When `WS_REDIS_ADAPTER=true`, Socket.IO uses `@socket.io/redis-adapter` to enable **horizontal scaling** (multiple websocket-service instances).

---

#### 12. RAG Service (AI)

```
Container: rag-transcendence   Port: 7860 (internal HTTP)
Runtime: Python 3.11
Framework: FastAPI + LangChain + FAISS
```

### RAG Pipeline

```
User question
    │
    ▼
1. Embedding (HuggingFace sentence-transformers)
    │
    ▼
2. Vector similarity search (FAISS index)
    │  Sources: culinary PDFs + PostgreSQL recipes (db_sync.py)
    ▼
3. Context retrieval (top-k chunks)
    │
    ▼
4. LLM Generation
    │  Primary:  Groq — LLaMA 3.3 70B (multi-key rotation)
    │  Fallback: Google Gemini 2.5 Flash (multi-key rotation)
    ▼
5. Streamed response → Frontend ChatBot
```

### Database Synchronisation

db_sync.py synchronises PostgreSQL recipes into the FAISS index every DB_SYNC_INTERVAL seconds (default: 3600s), keeping the chatbot up to date with platform content.

---

#### 13. Shared Infrastructure

### Redis

```
Container: redis (redis:alpine)   Port: 6380→6379
```

Used by:
- **api-gateway**: IP-based rate limiting
- **websocket-service**: pub/sub events, per-userId rate limiting, rooms
- **common**: rate-limiter.util.ts (sliding window)

### PostgreSQL

Single instance, multi-schema. Each service accesses only its own schema via distinct DATABASE_URL values injected by Vault.

---

#### 14. Secrets Management (Vault + SOPS)

### HashiCorp Vault — HA Cluster (3 nodes)

```
vault-1:8200 (leader)
vault-2:8201 (follower)
vault-3:8202 (follower)
Consensus: Raft
TLS: mTLS inter-node
```

**Secret injection flow**:

```
1. Boot: vault-tls-init → copies certificates with correct permissions
2. vault-init → initialises cluster, unseals, configures AppRole per service
3. vault-agent-{service} → authenticates via AppRole → generates /{service}.env
4. {service} → loads /vault/secrets/{service}.env → starts
```

**Shared volume**: vault-secrets (read-only for services)

### SOPS + age (at-rest encryption)

Source secrets are encrypted with **SOPS + age**:
```
cybersecurity/vault/secrets/secrets.env.enc   ← encrypted (Git-versionable)
```

At startup via Makefile:
```bash
# Decryption in RAM (tmpfs), never written to disk
sops --decrypt secrets.env.enc | docker compose ... up
```

The decrypted file is **never written to disk** — it is injected directly as an environment variable into vault-init.

---

## 15. Observability (ELK + Prometheus)

### ELK Stack 9

```
Elasticsearch :9200   → log storage (index per service)
Logstash :5140        → collection, parsing, enrichment
Kibana :5601          → dashboards, log exploration
```

All backend services send **Pino JSON** logs to Logstash via UDP/TCP on port 5140.

### Prometheus + Grafana

```
Prometheus :9191      → scrapes /metrics from each service
Grafana :3000         → metrics dashboards (CPU, memory, latency, errors)
Alertmanager :9093    → alerts (email, webhook)
node_exporter :9100   → host system metrics
```

Each microservice exposes a /metrics endpoint via metrics.util.ts (prom-client).

---

## 16. Docker Networks

| Network | Name | Services |
|---|---|---|
| ft | transcendence-net | All application services |
| vault-network | vault-network | Vault cluster (isolated) |
| monitor_net | monitoring-net | Prometheus, Grafana, ModSecurity |
| elk_net | internal | Elasticsearch, Logstash, Kibana |
| prom_net | internal | Prometheus, Alertmanager, Grafana |

> The WAF (ModSecurity) is on both ft AND monitor_net to be scraped by Prometheus.

---

## 17. Authentication Flows

### Classic sign-in (email/password)

```
Browser → POST /api/v1/auth/login
  → WAF (WAF check) → API Gateway (rate limit)
    → auth-service → PostgreSQL (bcrypt compare)
      ← { accessToken, refreshToken }
  → Frontend stores accessToken (in memory) + refreshToken (httpOnly cookie)
```

### Google OAuth2 (PKCE flow)

```
1. Browser → GET /api/v1/auth/google
     → auth-service generates state + code_verifier, redirects to Google

2. Google → GET /api/v1/auth/google/callback?code=...&scope=...&iss=...
     → WAF (CRS exclusions 930120/931130 for scope/iss)
     → auth-service exchanges code → Google access token
     → verifies/creates user in user-service
     ← redirect to frontend with JWT

3. Frontend → OAuthCallback.tsx → stores JWT → redirect /home
```

### Token refresh

```
Browser (accessToken expired)
  → POST /api/v1/auth/refresh { refreshToken }
    → auth-service verifies refreshToken in database
      ← new accessToken (+ refreshToken rotation)
```

### WebSocket authentication

```
Frontend useWebSocket.ts
  → Socket.IO connect wss://cookshare.me/ws/socket.io/
  → { auth: { token: accessToken } }
    → ws.auth.ts: jwt.verify() → socket.userId
    → Connection established
    → Heartbeat every 25s
    → Token expiry check every 60s
```

---

## 18. File Structure

```
ft_transcendence/
│
├── Makefile                        # Orchestration (SOPS decrypt + docker compose)
├── docker-compose.yml              # Root compose (networks, volumes, includes)
│
├── backend/
│   ├── package.json                # npm workspace (build:common, scripts)
│   ├── common/                     # Shared lib @transcendence/common
│   ├── api-gateway/                # Proxy + auth + swagger :3001
│   ├── auth-service/               # Authentication :3003
│   ├── user-service/               # Profiles + social :3004
│   ├── recipe-service/             # Recipes :3002
│   ├── chat-service/               # Messaging :3005
│   ├── notification-service/       # Notifications :3006
│   ├── websocket-service/          # Real-time Socket.IO :3007
│   └── rag-service/                # AI Python FastAPI :7860
│
├── frontend/
│   ├── vite.config.ts              # Vite config (HMR WSS :443/__vite_hmr)
│   ├── tailwind.config.js
│   └── src/                        # React source (see §3)
│
├── cybersecurity/
│   ├── vault/                      # HashiCorp Vault HA cluster
│   │   ├── docker-compose.yml
│   │   ├── config/                 # HCL vault-1/2/3.hcl (Raft)
│   │   ├── scripts/                # vault-init.sh, vault-agent configs
│   │   ├── tls/                    # Vault mTLS certificates
│   │   └── secrets/
│   │       └── secrets.env.enc     # SOPS+age encrypted secrets
│   ├── waf/
│   │   ├── docker-compose.yml
│   │   └── conf/
│   │       ├── nginx.conf.template                          # Global nginx config
│   │       ├── nginx-vhost.conf.template                    # Virtual hosts + proxy
│   │       ├── nginx-rate-limit.conf                        # Rate limit zones
│   │       ├── modsecurity-custom.conf                      # Custom rules (99-custom)
│   │       └── RESPONSE-999-EXCLUSION-RULES-AFTER-CRS.conf  # CRS exclusions
│   └── certs/                      # Internal self-signed TLS certificates
│
├── docker/
│   ├── nodjs/compose.yml           # Node.js services (all microservices)
│   ├── redis/compose.yml
│   ├── elk/compose.yml             # Elasticsearch + Logstash + Kibana
│   └── monitoring/compose.yml      # Prometheus + Grafana + Alertmanager
│
├── logs/                           # Log volumes (mounted from containers)
│   ├── api-gateway/
│   ├── auth-service/
│   ├── modsec/                     # ModSecurity audit.log (JSON)
│   ├── nginx/
│   └── ...
│
└── docs/                           # Technical documentation
    ├── api/                        # API specs per service
    ├── security/                   # Security guides
    └── deployment/                 # Deployment guides
```

---

## Exposed Ports Summary

| Port | Protocol | Service | Access |
|---|---|---|---|
| **443** | HTTPS/WSS | ModSecurity WAF (nginx) | Public |
| 3000 | HTTP | Grafana | Internal |
| 5601 | HTTP | Kibana | Internal |
| 6380 | TCP | Redis | Internal |
| 8200 | HTTPS | Vault-1 | Internal |
| 8201 | HTTPS | Vault-2 | Internal |
| 8202 | HTTPS | Vault-3 | Internal |
| 9093 | HTTP | Alertmanager | Internal |
| 9191 | HTTP | Prometheus | Internal |
| 9200 | HTTPS | Elasticsearch | Internal |

> All microservices (3001–3007) and the frontend (5173) are **only reachable internally** on the Docker network transcendence-net. No application port is directly exposed to the internet.
---

## Features List

| Feature | Member(s) | Description |
| :--- | :--- | :--- |
| **RAG AI Chatbot** | rdiary | Intelligent culinary assistant using advanced LLM prompts and semantic context retrieval. |
| **Microservices Core** | candriam | Highly available Backend infrastructure with consolidated API Gateway entry points. |
| **Premium Frontend** | mranaivo | Highly responsive UI with fluid Lottie animations and state-of-the-art motion design. |
| **Database Design** | candriam, mranaivo | Sophisticated relational schema across 5 distinct service domains. |
| **Infra & Security** | arazafin, tambinin | Production-grade security with ModSecurity WAF, Vault isolation, and full ELK observability. |

---

## Modules

CookShare accumulates a total of **30 points** (minimum required: 14), spread across 11 Major modules and 8 Minor modules.

### Point Summary

| Type | Count | Points each | Subtotal |
| :--- | :---: | :---: | :---: |
| Major modules | 11 | 2 | 22 pts |
| Minor modules | 9 | 1 | 9 pts |
| **Total** | **20** | — | **31 pts** |

---

### Major Modules (2 pts each)

#### 1. Web — Frameworks (Frontend + Backend)
> *Category: IV.1 Web — Major*

Both a frontend and a backend framework are used throughout the project.
- **Frontend:** React 19 with TypeScript, Vite, TailwindCSS 4, DaisyUI.
- **Backend:** Fastify (Node.js) with TypeScript across all microservices.
- **Implemented by:** mranaivo (frontend), candriam (backend)

> **Why this module is pertinent:** Provides the foundational architecture for a responsive, type-safe web application. React enables the interactive UI needed for a social cooking platform, while Fastify delivers the high-performance API required to handle concurrent users and real-time data.

---

#### 2. Web — Real-time Features (WebSockets)
> *Category: IV.1 Web — Major*

Full-duplex, bidirectional real-time communication is implemented via **Socket.IO** in a dedicated `websocket-service`.
- **Events handled:** user online/offline status, chat typing indicators (`typing_start` / `typing_stop`), real-time recipe room events (`join_recipe`, `leave_recipe`, `comment_typing_*`), and live shopping list synchronization (`shopping_list:add_item`, `update_item`, `delete_item`).
- **Resilience:** Redis-backed message buffering ensures missed messages are replayed on reconnect. Heartbeat/ping-pong health checks and graceful disconnect handling are both implemented.
- **Rate limiting:** per-socket event rate limiting protects against flooding.
- **Implemented by:** candriam

> **Why this module is pertinent:** Real-time features are essential for a social platform where users chat, see live updates on recipes, and collaborate on shopping lists. Without WebSockets, the user experience would be polling-based and sluggish.

---

#### 3. Web — User Interaction (Chat + Social Graph)
> *Category: IV.1 Web — Major*

Complete social layer connecting users across the platform:
- **Chat:** `chat-service` stores `Conversation` and `Message` entities; real-time delivery via the WebSocket service; typing indicators and read receipts surfaced in the `Messenger` / `Conversation` frontend pages.
- **Profiles:** dedicated profile page (`/profile/:id`) displaying avatar, bio, level, badges, follower/following counts and social actions.
- **Friends system:** send, accept and reject friend requests (`FriendRequest` table) managed through `friend.service.ts` and `friend.controller.ts`.
- **Follow system:** asymmetric follow/unfollow with `Follow` table.
- **Block system:** block/unblock users (`Block` table) preventing unwanted interactions, surfaced in `SettingsBlocked.tsx`.
- **Implemented by:** mranaivo (frontend), candriam (backend)

> **Why this module is pertinent:** A social cooking platform thrives on community engagement. Chat, follows, and friend systems create the network effects that retain users and encourage recipe sharing.

---

#### 4. Web — Public API
> *Category: IV.1 Web — Major*

A fully documented, rate-limited public API is exposed through the **API Gateway** service.
- **Documentation:** Swagger UI auto-generated at `https://${DOMAIN}:3001/documentation` from OpenAPI schemas defined inline on every route.
- **Security:** API key authentication (`apiKeyAuth`) required on all routes; strict and moderate rate limiters applied per endpoint category.
- **Endpoints cover CRUD operations** for authentication, users, recipes, collections, meal plans, shopping lists, chat, notifications, ingredients, and GDPR — far exceeding the 5-endpoint minimum.
- **Implemented by:** candriam

> **Why this module is pertinent:** A well-documented API with rate limiting enables third-party integrations and provides the structured contract between frontend and backend services, essential for microservices architecture.

---

#### 5. User Management — Standard User Management & Authentication
> *Category: IV.3 User Management — Major*

End-to-end identity and profile management:
- **Registration/Login:** email + hashed password (bcrypt) with email verification flow.
- **Profile updates:** username, name, bio, avatar (upload to Cloudinary via `cloudinary.service.ts`), password change.
- **Default avatar:** `/default-avatar.png` assigned at registration.
- **Online status:** real-time `isOnline` / `lastSeenAt` fields updated by the WebSocket service; displayed via `OnlineAvatar.tsx` and `WsStatusBadge.tsx`.
- **Roles:** `USER`, `MODERATOR`, `ADMIN` role enum with `isSuperAdmin` flag.
- **Implemented by:** mranaivo (frontend — `SettingsProfile`, `Profile/`), candriam (backend — `user.service.ts`, `profile.controller.ts`)

> **Why this module is pertinent:** User authentication and profile management are foundational to any multi-user platform. Without secure identity management, there can be no social features, personalized content, or access control.

---

#### 6. Artificial Intelligence — RAG System (Retrieval-Augmented Generation)
> *Category: IV.4 Artificial Intelligence — Major*

A complete RAG pipeline is implemented in the Python `rag-service`:
- **Vector store:** FAISS index built over culinary PDFs (loaded via LangChain's `DirectoryLoader` + `PyPDFLoader`) **and** live recipe data fetched from the database via `db_sync.py`.
- **Embeddings:** HuggingFace sentence-transformers convert documents and queries into dense vectors for semantic similarity search.
- **Retrieval chain:** LangChain `RunnablePassthrough` pipeline retrieves the top-k most relevant context chunks and passes them to the generation step.
- **Periodic sync:** `DB_SYNC_INTERVAL` controls automatic re-indexing of new recipes so the knowledge base stays up to date.
- **Implemented by:** rdiary

> **Why this module is pertinent:** The RAG system provides AI-powered recipe recommendations from culinary PDFs, differentiating CookShare from generic recipe sites. It enables users to ask domain-specific questions and receive accurate, context-aware answers.

---

#### 7. Artificial Intelligence — LLM Interface System
> *Category: IV.4 Artificial Intelligence — Major*

A complete LLM interface layer is built on top of the RAG service in `rag-service/app.py`:
- **Multi-provider rotating pool:** `RotatingLLM` class manages a pool of Groq (`llama-3.3-70b-versatile`) and Google Gemini (`gemini-2.5-flash`) instances loaded from comma-separated API key lists, rotating automatically on rate-limit or quota errors (HTTP 429 / `resource_exhausted`).
- **Streaming responses:** the FastAPI endpoint streams generated text back to the caller; the frontend `ChatBot/` component consumes the stream progressively.
- **Error handling & rate limiting:** per-request fallback across all available keys before raising; rate limit middleware on the FastAPI layer prevents abuse.
- **Text generation:** structured `ChatPromptTemplate` wraps retrieved context + user question into a prompt, feeding it to the active LLM and parsing the output with `StrOutputParser`.
- **Implemented by:** rdiary

> **Why this module is pertinent:** The AI chatbot is a key differentiator for user engagement. Multi-provider failover ensures high availability, while streaming responses provide a smooth conversational experience.

---

#### 8. Cybersecurity — WAF/ModSecurity + HashiCorp Vault
> *Category: IV.5 Cybersecurity — Major*

Production-grade security implemented at two distinct layers:
- **WAF/ModSecurity:** ModSecurity reverse proxy (OWASP Core Rule Set) sits in front of all services, filtering malicious HTTP traffic. Configuration lives in `cybersecurity/waf/`.
- **HashiCorp Vault:** All secrets (database URLs, JWT secrets, API keys, inter-service credentials) are injected at runtime by Vault Agent sidecars. No secrets are committed to the repository. Vault configuration, agent configs, and TLS certificates are in `cybersecurity/vault/`.
- **Zero-config deployment:** The boot sequence initializes Vault and distributes secrets automatically — no manual `.env` setup required.
- **Implemented by:** tambinin

> **Why this module is pertinent:** A production system handling user credentials and personal data must be protected from OWASP Top 10 attacks. Vault ensures secrets never leak into the codebase, while the WAF provides the first line of defense against malicious traffic.

---

#### 9. DevOps — ELK Stack (Log Management)
> *Category: IV.7 DevOps — Major*

Centralized structured log aggregation using the Elastic stack:
- **Logstash:** collects and transforms logs emitted by all Node.js microservices (Pino JSON format) and Nginx/ModSecurity.
- **Elasticsearch:** stores and indexes all log data.
- **Kibana:** dashboards and log search UI accessible at `https://${DOMAIN}:5601`.
- **Retention:** configurable via Elasticsearch ILM policies defined in `docker/elk/`.
- **Implemented by:** arazafin

> **Why this module is pertinent:** Debugging a distributed system with 7+ microservices requires centralized logging. Kibana enables log analysis without SSH access to containers, essential for troubleshooting issues in production.

---

#### 10. DevOps — Monitoring (Prometheus + Grafana)
> *Category: IV.7 DevOps — Major*

Full-stack metrics collection and visualization:
- **Prometheus:** scrapes metrics from all microservices and the host; configuration in `docker/monitoring/prometheus/`.
- **Grafana:** pre-built dashboards for service health and system metrics, accessible at `https://${DOMAIN}:3010`. Configuration in `docker/monitoring/grafana/`.
- **Alertmanager:** alert rules configured in `docker/monitoring/alertmanager/`.
- **Implemented by:** arazafin

> **Why this module is pertinent:** Monitoring provides observability into service health, latency, and resource usage. Proactive alerting prevents downtime and enables rapid incident response in a production environment.

---

#### 11. DevOps — Microservices Backend
> *Category: IV.7 DevOps — Major*

The backend is decomposed into **8 loosely-coupled microservices**, each with its own database schema, Fastify server, Prisma client, and Docker container:

| Service | Responsibility |
| :--- | :--- |
| `api-gateway` | Single public entry point; request routing, Swagger, rate limiting |
| `auth-service` | Credentials, JWT tokens, email verification, password reset |
| `user-service` | Profiles, social graph, gamification, GDPR |
| `recipe-service` | Recipes, ingredients, collections, meal plans, shopping lists |
| `chat-service` | Conversations and messages |
| `notification-service` | Activity notifications for all create/update/delete events |
| `websocket-service` | Real-time Socket.IO hub backed by Redis |
| `rag-service` | Python/FastAPI RAG pipeline |

- Inter-service communication uses HTTPS REST calls with a shared internal API key (`x-internal-api-key`).
- **Implemented by:** candriam (architecture, most backend services), mranaivo (database design co-author)

> **Why this module is pertinent:** Microservices architecture enables independent scaling and deployment of services. Each service can be updated or scaled without affecting others, improving resilience and maintainability of the platform.

---

### Minor Modules (1 pt each)

#### 1. Web — ORM
> *Category: IV.1 Web — Minor*

**Prisma ORM** is used across every TypeScript microservice (`auth-service`, `user-service`, `recipe-service`, `chat-service`, `notification-service`, `websocket-service`). Each service has its own `schema.prisma` with strongly-typed, auto-generated client code.
- **Implemented by:** mranaivo, candriam

> **Why this module is pertinent:** Prisma provides type-safe database access, eliminating runtime errors from SQL mistakes and accelerating development with auto-generated types across all services.

---

#### 2. Web — Notification System
> *Category: IV.1 Web — Minor*

A dedicated `notification-service` dispatches and persists notifications for all significant platform events (new followers, friend requests, recipe comments, etc.). The frontend polls/receives these in real-time and displays them in the `Navbar` dropdown.
- **Implemented by:** candriam

> **Why this module is pertinent:** Notifications keep users informed about social activity and drive engagement. Without notifications, users would miss interactions and return less frequently.

---

#### 3. Web — Advanced Search
> *Category: IV.1 Web — Minor*

A full-featured search interface is implemented in the `Search/` component:
- **Multi-tab results:** searches across recipes, users, and ingredients simultaneously.
- **Search history:** recent queries persisted locally and surfaced in `SearchHistory.tsx`.
- **Instant suggestions:** `SearchSug.tsx` provides autocomplete as the user types.
- **Implemented by:** mranaivo

> **Why this module is pertinent:** Content discoverability is critical for a recipe platform. Users need to quickly find recipes by name, ingredients, or chef, making search a core feature for user retention.

---

#### 4. Web — File Upload & Management
> *Category: IV.1 Web — Minor*

Secure file upload is implemented for avatars and recipe images:
- **Avatar upload:** handled at registration and in `SettingsProfile.tsx` via `ChangePicture.tsx`; files are sent as `multipart/form-data` through the API Gateway.
- **Cloudinary storage:** `cloudinary.service.ts` in `user-service` manages upload, transformation, and CDN delivery.
- **Recipe images:** the `image.controller.ts` in `recipe-service` handles per-recipe image management.
- **Validation:** file type and size are validated both client-side and in the backend.
- **Implemented by:** mranaivo (frontend), candriam (backend)

> **Why this module is pertinent:** Visual content is central to a cooking platform. High-quality recipe images and user avatars enhance the platform's appeal, while Cloudinary CDN ensures fast delivery globally.

---

#### 5. Web — Real-time Collaborative Features
> *Category: IV.1 Web — Minor*

The **Shopping List** is a live collaborative workspace synchronized in real-time across all browser sessions:
- Add, update (rename/check), and delete items are instantly broadcast to all sockets in the `shopping_list_{userId}` room.
- Actions are persisted in the `recipe-service` database and the WebSocket service proxies the mutations, ensuring consistency.
- **Implemented by:** candriam (backend), mranaivo (frontend)

> **Why this module is pertinent:** Collaborative shopping lists enable users to plan meals together, a key social cooking feature that differentiates CookShare from static recipe sites.

---

#### 6. User Management — OAuth 2.0 (Google)
> *Category: IV.3 User Management — Minor*

Google OAuth 2.0 authentication is fully integrated:
- **Backend:** `oauth.controller.ts` in `auth-service` handles the OAuth redirect flow (`/auth/google` → `/auth/google/callback`), token exchange, and account linking/creation. Users can also unlink their Google account.
- **Frontend:** `OAuthCallback.tsx` handles the redirect landing; login/register pages surface the Google sign-in button.
- **Implemented by:** candriam

> **Why this module is pertinent:** OAuth reduces sign-up friction and provides secure authentication without managing passwords. It improves user experience and increases conversion rates for new registrations.

---

#### 7. Data & Analytics — GDPR Compliance
> *Category: IV.8 Data & Analytics — Minor*

Full compliance with the "Right to be Forgotten" and data portability principles:
- **Data export (`exportUserData`):** compiles a complete JSON snapshot of the user's profile, social graph, recipes, notifications, and chat messages gathered via inter-service calls.
- **Account deletion:** initiates a two-step flow — an email confirmation token (`AccountDeletionToken`) is sent, and confirming it (`/gdpr/confirm-deletion`) triggers a cross-service purge (auth credentials, profile, UGC) that is permanent and irreversible.
- **Email confirmation emails:** dispatched through the `notification-service` before any destructive operation.
- **Implemented by:** candriam

> **Why this module is pertinent:** GDPR compliance is a legal requirement for any platform serving EU users. Data export and deletion rights build trust and demonstrate responsible data handling practices.

---

#### 8. Games & UX — Gamification System
> *Category: IV.6 Games & User Experience — Minor*

A persistent, event-driven gamification engine rewards user activity:
- **XP & Levels:** users accumulate XP on actions (`RECIPE_CREATED` +50 XP, `FOLLOWER_GAINED` +20 XP, `REVIEW_GIVEN` +10 XP, `FIRST_LOGIN` +5 XP). Level is computed as `floor(sqrt(xp / 100)) + 1` and stored on the `User` model.
- **Badges:** dynamic badge awarding based on threshold-triggered criteria (`RECIPE_COUNT`, `FOLLOWER_COUNT`, `REVIEW_COUNT`). Badges are defined in the `Badge` table (slug, name, description, iconUrl, threshold) and linked to users via `UserBadge`.
- **Persistence:** all data stored in PostgreSQL via Prisma; fully exposed through the `getGamificationProfileHandler` API endpoint.
- **Visual feedback:** level and badge progress is displayed on the profile page.
- **Implemented by:** mranaivo (frontend Profile display), candriam (backend — `gamification.service.ts`, `gamification.controller.ts`)

> **Why this module is pertinent:** Gamification creates engagement loops that encourage content creation, social interactions, and repeat visits. XP, levels, and badges reward active users and foster a sense of achievement.

---

#### 9. Modules of choice - Redis
> *Category: V.10 Modules of choice — Minor*

Redis serves multiple critical functions across the CookShare infrastructure:
- **WebSocket message buffering:** the `websocket-service` uses Redis streams to buffer messages when clients are temporarily disconnected, enabling missed-message replay on reconnect.
- **Session & rate limiting:** Redis powers the in-memory rate limiting counters in the API Gateway and per-socket rate limiting in the WebSocket service.
- **Cache layer:** frequently accessed data (user sessions, recipe metadata) is cached in Redis to reduce database load.
- **Pub/Sub:** real-time events (new notifications, chat messages, shopping list updates) are broadcast across service instances via Redis pub/sub.
- **Implemented by:** candriam, arazafin

> **Why this module is pertinent:** Redis is foundational infrastructure for a real-time, scalable platform. It powers messaging, caching, rate limiting, and pub/sub — all essential for low-latency user experiences.

---

## Individual Contributions

| Member | Primary areas |
| :--- | :--- |
| **candriam** | Backend architecture, API Gateway, services, WebSocket |
| **mranaivo** | Frontend architecture, auth UI, search, profile, UX redesigns |
| **rdiary** | RAG/LLM service, ChatBot, favorites, follow context, recipe display |
| **tambinin** | HashiCorp Vault, WAF/ModSecurity, security layer |
| **arazafin** | ELK stack, monitoring, Nginx, Docker infrastructure |

---

### candriam

**Role:** Project Manager & Backend Lead

**Contributions:**
- Designed and implemented the full **microservices backend** architecture: `auth-service`, `user-service`, `recipe-service`, `chat-service`, `notification-service`, `websocket-service`, and `api-gateway`.
- Built the **API Gateway** with full Swagger/OpenAPI documentation, request proxying, rate limiting (strict/moderate), and inter-service routing.
- Implemented the **WebSocket service**: Socket.IO hub backed by Redis (message buffering, missed-message replay, heartbeat, per-socket rate limiting, room management).
- Developed the **chat service** (Conversation + Message persistence, real-time delivery) and **notification service**.
- Implemented **Google OAuth 2.0** integration (redirect flow, callback, account linking/unlinking) in `auth-service`.
- Built the **GDPR module**: cross-service data export and email-confirmed account deletion flow.
- Developed the **gamification engine**: XP/level calculation, threshold-based badge awarding, `processGamificationEvent` pipeline.
- Implemented **shopping list** real-time sync (WebSocket events dispatching to the recipe service and broadcasting to connected clients).
- Configured **JWT authentication middleware** and `authMiddleware` shared across the common package.
- Contributed to frontend improvements: responsive design, OAuth callback page, pagination, filter bar, collections modal.

**Challenges:** Designing a secure and consistent inter-service communication pattern using HTTPS + `x-internal-api-key` without introducing circular dependencies or tight coupling between services.

---

### rdiary

**Role:** Product Owner & AI/UX Lead

**Contributions:**
- Built the entire **RAG service** (`rag-service/app.py`): FAISS vector index over culinary PDFs + live DB data (`db_sync.py`), HuggingFace embeddings, and LangChain retrieval chain with periodic recipe re-indexing.
- Implemented the **LLM interface layer**: `RotatingLLM` class with multi-provider failover (Groq `llama-3.3-70b` + Gemini `gemini-2.5-flash`), API key pool management, and streaming response handling.
- Enhanced the **ChatBot** frontend component: clear chat functionality, markdown rendering, improved initial message handling.
- Implemented **favorites context** (upsert/idempotent) and **follow context** and integrated them into PostCard and feed components.
- Added **comment editing and deletion** in `RecipeComments` and `Comment` components.
- Added **lazy loading** to images across multiple components for improved performance.
- Integrated **dietary tags** into the recipe service and UI.
- Implemented **real-time user status tracking** (online/offline feed updates via WebSocket listeners).
- Fixed the **vault-agent-rag infinite loop** and resolved `RunnableLambda` invocation issues in the RAG chain.
- Enhanced the **FindBar** component with customizable placeholders and handlers across feeds.
- Wrote and refactored the **Privacy Policy** and **Terms of Service** pages.

**Challenges:** Building a robust multi-provider LLM rotation that transparently handles quota exhaustion at runtime without exposing failures to the end user.

---

### mranaivo

**Role:** Tech Lead & Frontend Lead

**Contributions:**
- Defined the **frontend architecture**: React 19 + TypeScript + Vite project structure, TailwindCSS 4/DaisyUI configuration, custom hooks pattern, constants/services/types organisation.
- Implemented the full **authentication UI**: Login, Register, EmailVerify, ForgotPassword, ResetPassword pages with Lottie animations and password strength indicator.
- Built the **Messenger / chat UI**: `Messenger`, `Conversation`, `ConversationBody`, `ConversationHeader`, `ConversationFooter` components with real-time Socket.IO integration; added the `GET /conversations` endpoint and made Messenger/404 fully responsive.
- Developed the **Profile page** (`ProfileIdentity`, `ProfileTabs`, `ProfileActions`, `ProfileSkeleton`) with follower/following counts, friends system, and social action buttons.
- Implemented **Search**: `SearchInput`, `SearchResults`, `SearchTabs`, `SearchHistory`, instant suggestions (`SearchSug`), and `useSearch` hook.
- Built **recipe feeds** (`ForYouFeed`, `PostCard`) and redesigned **PostCard** with a responsive 3-column layout and interactive features, and **RecipeUI** cards (category badge top-left, always-visible rating).
- Refactored **Settings** into domain-specific components (`SettingsProfile`, `SettingsSecurity`, `SettingsBlocked`, `SettingsDanger`) each driven by a `useSettings` hook.
- Added the **block system UI**, **gamification display** (XP bar, badges on profile), and **meal planning** feature pages.
- Implemented **Settings** password reset and account deletion confirmation UI; wired `ForgotPassword` and `ResetPassword` pages to the backend email flow.
- Applied **code-splitting and bundle optimisation** (lazy loading, dynamic imports) to reduce initial load time.
- Fixed social action UI feedback (favorites sync, upsert/idempotent pattern, error display on follow/block).
- Set up the **database schema co-design**: multi-service schema layout, Prisma relations for social graph and gamification models.

**Challenges:** Managing complex frontend state across WebSocket events, API responses, and optimistic UI updates without a global bloated state tree — solved by scoping Zustand stores per feature domain.

---

### tambinin

**Role:** Developer — Security & Infrastructure

**Contributions:**
- Implemented the full **HashiCorp Vault** cluster: initialisation scripts, unseal automation, service-specific policies, and Vault Agent sidecar configurations for all 7 backend services.
- Designed the **secret template system**: each Vault Agent renders `.env`-style secret files at container startup, enabling zero-config deployment with no secrets in the repository.
- Built the **WAF/ModSecurity** layer: custom rule sets, exclusion rules to prevent false positives on recipe title/description fields, and Docker Compose integration.
- Wrote extensive **security documentation**: WAF architecture guide, CRS exclusion rule guide, Vault integration guides for each backend service.
- Tuned ModSecurity paranoia level and rate-limit exclusions via environment variables.
- Investigated and fixed WebSocket traffic blocking by ModSecurity.

**Challenges:** Writing precise ModSecurity exclusion rules that disable only the specific CRS checks causing false positives on legitimate recipe content, without weakening the overall WAF posture.

---

### arazafin

**Role:** Developer — DevOps & Infrastructure

**Contributions:**
- Established the initial **Docker Compose infrastructure**: all backend services, PostgreSQL, Nginx reverse proxy, ELK stack, and Prometheus/Grafana in a single orchestrated stack.
- Set up the **ELK stack**: Elasticsearch (ML and index buffer config, ILM retention), Logstash pipelines (Pino JSON + Nginx/ModSecurity log ingestion), Kibana dashboards.
- Configured **Prometheus + Grafana + Alertmanager**: scrape configs, custom dashboards, alert rules, and dedicated monitoring network (`prom_net`).
- Configured **Nginx** as the main reverse proxy: rate limiting, caching headers for static assets, WebSocket upgrade support, and virtual host templates for the WAF service.
- **Containerised the frontend** development server and integrated it behind the Nginx reverse proxy.
- Migrated the project from Docker to **Podman**-compatible configurations (Makefile, compose files, health checks).
- Led the README documentation restructuring and initial architecture documentation.

**Challenges:** Making the ELK + Prometheus stacks initialise reliably inside Podman while respecting startup ordering dependencies (Elasticsearch ready before Logstash, Vault unsealed before services start).

---

## Resources

### Documentation and References

- **Frontend**: [React 19 Documentation](https://react.dev/), [Vite Guide](https://vitejs.dev/), [TailwindCSS 4](https://tailwindcss.com/).
- **Backend**: [Fastify Documentation](https://www.fastify.io/), [Prisma ORM](https://www.prisma.io/), [Supabase](https://supabase.com/).
- **Security**: [ModSecurity CRS](https://coreruleset.org/), [HashiCorp Vault](https://www.vaultproject.io/).
- **Infrastructure**: [Docker](https://www.docker.com/), [ELK Stack](https://www.elastic.co/elastic-stack).

### AI Usage

AI tools (GitHub Copilot, ChatGPT, Claude) were used throughout the project in the following ways:

- **Idea discussion & brainstorming:** debating architectural choices, module selection, and feature design before committing to an implementation direction.
- **Document drafting:** writing and refining technical documentation, the README, the Privacy Policy, and the Terms of Service.
- **Research:** exploring unfamiliar technologies (LangChain, HashiCorp Vault, FAISS, Socket.IO clustering with Redis) and summarizing relevant documentation.
- **Implementation planning:** structuring step-by-step plans for complex features such as the RAG pipeline, the GDPR deletion flow, and the WebSocket real-time layer before writing any code.
- **Debugging:** analysing error messages, tracing inter-service communication issues, and identifying edge cases in Prisma schemas or Fastify middleware chains.

All AI-generated content was reviewed, tested, and understood by the team member responsible for the relevant part of the project before being integrated.

---
