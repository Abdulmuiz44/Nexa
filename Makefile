.PHONY: help dev build test clean docker-build docker-run docker-compose-up docker-compose-down

# Default target
help:
	@echo "Available commands:"
	@echo "  dev                 - Start development server"
	@echo "  build               - Build production application"
	@echo "  test                - Run all tests"
	@echo "  test-watch          - Run tests in watch mode"
	@echo "  test-e2e            - Run E2E tests"
	@echo "  lint                - Run linter"
	@echo "  format              - Format code"
	@echo "  check               - Run all checks (lint, typecheck, test)"
	@echo "  clean               - Clean build artifacts"
	@echo "  docker-build        - Build Docker image"
	@echo "  docker-run          - Run Docker container"
	@echo "  docker-compose-up   - Start all services with Docker Compose"
	@echo "  docker-compose-down - Stop all services"

# Development
dev:
	npm run dev

build:
	npm run build

# Testing
test:
	npm run test

test-watch:
	npm run test:watch

test-e2e:
	npm run test:e2e

# Code quality
lint:
	npm run lint

format:
	npm run format

check:
	npm run check

# Cleanup
clean:
	rm -rf .next
	rm -rf node_modules
	rm -rf coverage
	rm -rf playwright-report

# Docker
docker-build:
	docker build -t nexa .

docker-run:
	docker run -p 3000:3000 --env-file .env.local nexa

docker-compose-up:
	docker-compose up -d

docker-compose-down:
	docker-compose down

# Database
db-generate:
	npx prisma generate

db-migrate:
	npx prisma migrate dev

db-studio:
	npx prisma studio

# Production deployment
deploy-vercel:
	vercel --prod

# Install dependencies
install:
	npm ci

# Setup development environment
setup: install db-generate
	cp .env.example .env.local
	@echo "Please edit .env.local with your configuration"
