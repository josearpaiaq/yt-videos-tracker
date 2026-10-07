help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "  dev        Start the API and dashboard together"
	@echo "  api        Start the API on :8080"
	@echo "  dashboard  Install deps and start the dashboard on :5173"
	@echo "  extension  Build and zip the extension into extension/.output/"

dev:
	$(MAKE) -j2 api dashboard

api:
	cd ./api && go run ./cmd/server
dashboard:
	cd ./dashboard && pnpm install && pnpm dev
extension:
	cd ./extension && pnpm install && pnpm zip && open .output/

.PHONY: help dev api dashboard extension
