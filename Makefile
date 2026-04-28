NAME = ft_transcendence
FILE = ./docker-compose.yml
C = docker
DC = $(C) compose -f $(FILE) --project-name $(NAME)

DOMAIN = cookshare.me

# ═══════════════════════════════════════════════════════════════════════════
# Default target
# ═══════════════════════════════════════════════════════════════════════════
all: up

# ═══════════════════════════════════════════════════════════════════════════
# Docker lifecycle
# ═══════════════════════════════════════════════════════════════════════════

check-sops:
	@command -v sops > /dev/null 2>&1 || { echo "ERROR: sops not installed. See: https://github.com/getsops/sops/releases"; exit 1; }
	@command -v age > /dev/null 2>&1 || { echo "ERROR: age not installed. See: https://github.com/FiloSottile/age/releases"; exit 1; }
	@test -f cybersecurity/vault/secrets/secrets.env.enc || { echo "ERROR: secrets.env.enc not found in cybersecurity/vault/secrets/"; exit 1; }
	@test -f $(HOME)/.config/sops/age/keys.txt || { echo "ERROR: age private key not found at ~/.config/sops/age/keys.txt"; exit 1; }
	@echo "SOPS check passed."

## up: Build and start all containers
up: setup-logs vault-tls check-sops
	@docker/scripts/elk.sh
	@docker/scripts/monitoring.sh
	@cybersecurity/certs/generate_internal_certs.sh
	@bash cybersecurity/waf/generate_ssl_cert.sh
	@echo "Starting → DOMAIN=$(DOMAIN)"
	@sops --decrypt --input-type dotenv --output-type dotenv \
		cybersecurity/vault/secrets/secrets.env.enc > /dev/shm/.secrets.env && \
		set -a && . /dev/shm/.secrets.env && set +a && \
		DOMAIN=$(DOMAIN) $(DC) up -d; \
		EXIT=$$?; rm -f /dev/shm/.secrets.env; exit $$EXIT
	@echo "Waiting for backend setup to complete..."
	@$(C) wait setup-backend > /dev/null 2>&1
	@rm -f backend/allset
	@echo "Backend setup complete. allset file removed."
	@echo ""
	@echo "══════════════════════════════════════════════════"
	@echo "  ✅ App running"
	@echo "  Open: https://$(DOMAIN)"
	@echo "══════════════════════════════════════════════════"

vault-tls:
	@if [ ! -f cybersecurity/vault/tls/vault-cert.pem ]; then \
		echo "Generating Vault TLS certificates..."; \
		sh cybersecurity/vault/scripts/generate-tls.sh; \
	else \
		echo "Vault TLS certificates already exist, skipping."; \
	fi

## status: Show domain and container state
status:
	@echo "═══════════════════════════════════════════════════════"
	@echo "  Domain:     $(DOMAIN)"
	@echo "  API URL:    https://$(DOMAIN)/api/v1"
	@echo "  WS URL:     https://$(DOMAIN)"
	@echo "  Browser:    https://$(DOMAIN)"
	@echo "═══════════════════════════════════════════════════════"
	@$(DC) ps 2>/dev/null || true

## start: Start stopped containers
start:
	$(DC) start

## stop: Stop running containers
stop:
	$(DC) stop

## down: Stop and remove all containers, volumes
down:
	$(DC) down --remove-orphans -v

## clean: Stop and remove containers
clean: stop
	$(DC) rm -f

## fclean: Full clean — remove containers, volumes, node_modules, certs
fclean: down clean-deps
	$(C) volume prune -f
	@rm -rf logs
	@rm -rf docker/elk/.env
	@rm -rf docker/monitoring/.env
	@rm -f cybersecurity/vault/tls/vault-cert.pem cybersecurity/vault/tls/vault-key.pem

clean-deps:
	@echo "Removing all node_modules..."
	@sudo rm -fr frontend/node_modules
	@sudo rm -rf backend/node_modules
	@sudo rm -rf backend/*/node_modules
	@sudo rm -rf backend/allset

setup-logs:
	@mkdir -p logs/api-gateway
	@mkdir -p logs/auth-service
	@mkdir -p logs/chat-service
	@mkdir -p logs/notification-service
	@mkdir -p logs/recipe-service
	@mkdir -p logs/user-service
	@mkdir -p logs/websocket-service
	@mkdir -p logs/modsec
	@mkdir -p logs/nginx
	@mkdir -p logs/rag-service

db-push:
	@echo "Syncing database schemas..."
	@$(C) exec user sh -c "set -a && . /vault/secrets/user.env && set +a && npx prisma db push --accept-data-loss"
	@$(C) exec auth sh -c "set -a && . /vault/secrets/auth.env && set +a && npx prisma db push --accept-data-loss"
	@$(C) exec recipe sh -c "set -a && . /vault/secrets/recipe.env && set +a && npx prisma db push --accept-data-loss"
	@$(C) exec chat sh -c "set -a && . /vault/secrets/chat.env && set +a && npx prisma db push --accept-data-loss"
	@$(C) exec notification sh -c "set -a && . /vault/secrets/notification.env && set +a && npx prisma db push --accept-data-loss"
	@echo "All databases synced."

promote-admin:
	@echo "Promoting user to admin..."
	@read -p "Enter username to promote: " username; \
	$(C) exec user sh -c "set -a && . /vault/secrets/user.env && set +a && cd /usr/src/app/user-service && npx ts-node scripts/promoteAdmin.ts $$username"

re: clean all

rebuild: fclean all

rag-logs:
	@$(C) logs -f $(RAG_CONTAINER)

rag-rebuild:
	$(DC) up -d --build $(RAG_SERVICE)

rag-status:
	@$(C) inspect --format='{{.State.Status}}' $(RAG_CONTAINER) 2>/dev/null || echo "RAG container not running"

.PHONY: all up start stop status down clean fclean re rebuild db-push promote-admin vault-tls rag-logs rag-rebuild rag-status check-sops help

## help: Show this help message
help:
	@echo "═══════════════════════════════════════════════════════"
	@echo "  CookShare — Makefile Commands"
	@echo "═══════════════════════════════════════════════════════"
	@echo ""
	@echo "  LIFECYCLE:"
	@echo "    make up         Start all containers"
	@echo "    make start      Start stopped containers"
	@echo "    make stop       Stop containers"
	@echo "    make status     Show domain and container state"
	@echo "    make down       Stop & remove containers + volumes"
	@echo "    make re         Clean + restart"
	@echo "    make rebuild    Full clean + restart"
	@echo ""
	@echo "  DATABASE:"
	@echo "    make db-push        Sync all Prisma schemas"
	@echo "    make promote-admin  Promote a user to admin"
	@echo ""
	@echo "  CLEANUP:"
	@echo "    make clean      Stop & remove containers"
	@echo "    make fclean     Full clean (volumes, deps, certs)"
	@echo ""
	@echo "  RAG SERVICE:"
	@echo "    make rag-logs     Show RAG service logs"
	@echo "    make rag-rebuild  Rebuild RAG container"
	@echo "    make rag-status   Check RAG container status"
	@echo ""
	@echo "  URL: https://$(DOMAIN)"
	@echo "═══════════════════════════════════════════════════════"
