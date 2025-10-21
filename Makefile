# ============================================================================
# Makefile for Sora2 Platform
# ============================================================================
# Simplifies common Docker and deployment operations
# ============================================================================

.PHONY: help build build-api build-web push deploy start stop restart status logs clean health test

# Default target
.DEFAULT_GOAL := help

# Load environment variables
include .env.production
export

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

## help: Show this help message
help:
	@echo "$(GREEN)Sora2 Platform - Available Commands$(NC)"
	@echo ""
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' | sed -e 's/^/ /'
	@echo ""

## build: Build all Docker images
build:
	@echo "$(BLUE)Building all Docker images...$(NC)"
	@DOCKER_BUILDKIT=1 ./scripts/docker-build.sh all false

## build-api: Build API Docker image only
build-api:
	@echo "$(BLUE)Building API Docker image...$(NC)"
	@DOCKER_BUILDKIT=1 ./scripts/docker-build.sh api false

## build-web: Build Web Docker image only
build-web:
	@echo "$(BLUE)Building Web Docker image...$(NC)"
	@DOCKER_BUILDKIT=1 ./scripts/docker-build.sh web false

## push: Build and push all images to registry
push:
	@echo "$(BLUE)Building and pushing images...$(NC)"
	@DOCKER_BUILDKIT=1 ./scripts/docker-build.sh all true

## deploy: Deploy to production
deploy:
	@echo "$(BLUE)Deploying to production...$(NC)"
	@./scripts/docker-deploy.sh deploy

## start: Start all services
start:
	@echo "$(BLUE)Starting services...$(NC)"
	@./scripts/docker-deploy.sh start

## stop: Stop all services
stop:
	@echo "$(BLUE)Stopping services...$(NC)"
	@./scripts/docker-deploy.sh stop

## restart: Restart all services
restart:
	@echo "$(BLUE)Restarting services...$(NC)"
	@./scripts/docker-deploy.sh restart

## status: Show service status
status:
	@./scripts/docker-deploy.sh status

## logs: Show all service logs
logs:
	@./scripts/docker-deploy.sh logs

## logs-api: Show API service logs
logs-api:
	@./scripts/docker-deploy.sh logs api

## logs-web: Show Web service logs
logs-web:
	@./scripts/docker-deploy.sh logs web

## logs-db: Show PostgreSQL logs
logs-db:
	@./scripts/docker-deploy.sh logs postgres

## logs-redis: Show Redis logs
logs-redis:
	@./scripts/docker-deploy.sh logs redis

## health: Check service health
health:
	@./scripts/docker-deploy.sh health

## clean: Remove all containers, images, and volumes
clean:
	@echo "$(YELLOW)Warning: This will remove all containers, images, and volumes$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f docker-compose.prod.yml down -v --rmi all; \
		echo "$(GREEN)Cleanup completed$(NC)"; \
	fi

## clean-images: Remove only Docker images
clean-images:
	@echo "$(BLUE)Removing Docker images...$(NC)"
	@docker images | grep sora2 | awk '{print $$3}' | xargs docker rmi -f || true
	@echo "$(GREEN)Images removed$(NC)"

## prune: Prune Docker system (remove unused data)
prune:
	@echo "$(BLUE)Pruning Docker system...$(NC)"
	@docker system prune -af --volumes
	@echo "$(GREEN)Prune completed$(NC)"

## test: Run tests in Docker containers
test:
	@echo "$(BLUE)Running tests...$(NC)"
	@docker-compose -f docker-compose.prod.yml run --rm api pnpm test
	@docker-compose -f docker-compose.prod.yml run --rm web pnpm test

## shell-api: Open shell in API container
shell-api:
	@docker-compose -f docker-compose.prod.yml exec api sh

## shell-web: Open shell in Web container
shell-web:
	@docker-compose -f docker-compose.prod.yml exec web sh

## shell-db: Open PostgreSQL shell
shell-db:
	@docker-compose -f docker-compose.prod.yml exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

## shell-redis: Open Redis CLI
shell-redis:
	@docker-compose -f docker-compose.prod.yml exec redis redis-cli

## backup-db: Backup PostgreSQL database
backup-db:
	@echo "$(BLUE)Backing up database...$(NC)"
	@mkdir -p backups
	@docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $(POSTGRES_USER) $(POSTGRES_DB) > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup completed$(NC)"

## restore-db: Restore PostgreSQL database from backup
restore-db:
	@echo "$(YELLOW)Available backups:$(NC)"
	@ls -1 backups/*.sql
	@read -p "Enter backup filename: " backup; \
	echo "$(BLUE)Restoring database from $$backup...$(NC)"; \
	docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $(POSTGRES_USER) $(POSTGRES_DB) < $$backup; \
	echo "$(GREEN)Restore completed$(NC)"

## dev: Start development environment
dev:
	@echo "$(BLUE)Starting development environment...$(NC)"
	@docker-compose -f docker-compose.yml up -d
	@echo "$(GREEN)Development environment started$(NC)"

## dev-logs: Show development logs
dev-logs:
	@docker-compose -f docker-compose.yml logs -f

## dev-stop: Stop development environment
dev-stop:
	@docker-compose -f docker-compose.yml down

## migrate: Run database migrations
migrate:
	@echo "$(BLUE)Running database migrations...$(NC)"
	@docker-compose -f docker-compose.prod.yml exec api pnpm migrate
	@echo "$(GREEN)Migrations completed$(NC)"

## migrate-create: Create new migration
migrate-create:
	@read -p "Enter migration name: " name; \
	docker-compose -f docker-compose.prod.yml exec api pnpm migrate:create $$name

## stats: Show Docker resource usage
stats:
	@docker stats --no-stream

## inspect-api: Inspect API container
inspect-api:
	@docker inspect sora2-api-prod | jq

## inspect-web: Inspect Web container
inspect-web:
	@docker inspect sora2-web-prod | jq

## network: Show Docker network information
network:
	@docker network inspect sora2-network

## volumes: Show Docker volume information
volumes:
	@docker volume ls | grep sora2

## ps: Show running containers
ps:
	@docker ps --filter "name=sora2"

## images: Show Sora2 images
images:
	@docker images | grep sora2

## version: Show version information
version:
	@echo "Sora2 Platform Version: $(VERSION)"
	@echo "Docker Version: $$(docker --version)"
	@echo "Docker Compose Version: $$(docker-compose --version)"
