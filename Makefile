# Ports come from each project's .env (PORT=...), with the usual defaults.
API_PORT := $(or $(shell sed -n "s/^PORT=['\"]*\([0-9]*\).*/\1/p" api/.env 2>/dev/null),8080)
DASHBOARD_PORT := $(or $(shell sed -n "s/^PORT=['\"]*\([0-9]*\).*/\1/p" dashboard/.env 2>/dev/null),5173)

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "  dev        Start the API and dashboard together"
	@echo "  api        Start the API on :$(API_PORT)"
	@echo "  dashboard  Install deps and start the dashboard on :$(DASHBOARD_PORT)"
	@echo "  extension  Build and zip the extension into extension/.output/"
	@echo "  bg         Start the API and dashboard in the background (logs in /tmp/yt-*.log)"
	@echo "  status     Show what is listening on :$(API_PORT) and :$(DASHBOARD_PORT)"
	@echo "  stop       Stop whatever is listening on :$(API_PORT) and :$(DASHBOARD_PORT)"

dev:
	$(MAKE) -j2 api dashboard

api:
	cd ./api && go run ./cmd/server
dashboard: dashboard/node_modules
	cd ./dashboard && pnpm dev
extension: extension/node_modules
	cd ./extension && pnpm zip && open .output/

# Reinstall only when the manifest or lockfile is newer than node_modules.
dashboard/node_modules: dashboard/package.json dashboard/pnpm-lock.yaml
	cd ./dashboard && pnpm install
	@touch $@
extension/node_modules: extension/package.json extension/pnpm-lock.yaml
	cd ./extension && pnpm install
	@touch $@

bg: dashboard/node_modules
	cd ./api && nohup go run ./cmd/server > /tmp/yt-api.log 2>&1 &
	cd ./dashboard && nohup pnpm dev > /tmp/yt-dashboard.log 2>&1 &
	@echo "Started. Logs: tail -f /tmp/yt-api.log /tmp/yt-dashboard.log"
status:
	@lsof -nP -iTCP:$(API_PORT) -iTCP:$(DASHBOARD_PORT) -sTCP:LISTEN || echo "Nothing running"
stop:
	@pids=$$(lsof -nP -iTCP:$(API_PORT) -iTCP:$(DASHBOARD_PORT) -sTCP:LISTEN -t | xargs); \
	if [ -n "$$pids" ]; then kill $$pids && echo "Stopped $$pids"; else echo "Nothing running"; fi

.PHONY: help dev api dashboard extension bg status stop
