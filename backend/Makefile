.PHONY: dev build migrate-up migrate-down lint test

dev:
	GIN_MODE=debug go run ./cmd/server

build:
	go build -o bin/server ./cmd/server

migrate-up:
	migrate -path ./migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path ./migrations -database "$(DATABASE_URL)" down 1

lint:
	golangci-lint run ./...

test:
	go test ./... -v
