#!/bin/bash
# Jaeger all-in-one for kbTrainer's talk / demo mode (npm run start:jaegger).
# Mounts jaeger-v2.yaml (collector config, AI MCP endpoint on :16686) and
# jaeger-ui.json (span tags -> vscode:// jumps into files and into the
# mnemographica Live Trace sidebar) — both sit next to this script.
#
# Shares the container name with the tactica-nestjs demo (jaeger-mnem, same
# ports): a RUNNING jaeger-mnem is reused as is, so its traces survive; a
# stopped one is replaced with this config.

set -eu

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v docker >/dev/null 2>&1; then
	echo "docker not found in PATH — install docker first:" >&2
	echo "  https://docs.docker.com/engine/install/" >&2
	exit 1
fi

if ! docker info >/dev/null 2>&1; then
	echo "docker is installed but the daemon is not reachable:" >&2
	docker info 2>&1 >/dev/null | head -3 | sed 's/^/  /' >&2
	echo "" >&2
	echo "usual fixes:" >&2
	echo "  sudo systemctl start docker      # daemon not running" >&2
	echo "  sudo usermod -aG docker \$USER    # socket permission denied" >&2
	echo "  (log out and back in after usermod)" >&2
	exit 1
fi

if docker ps --format '{{.Names}}' | grep -qx 'jaeger-mnem'; then
	echo "jaeger-mnem already running: UI on http://localhost:16686, OTLP HTTP on :4318"
	exit 0
fi

if docker ps -a --format '{{.Names}}' | grep -qx 'jaeger-mnem'; then
	echo "replacing stopped jaeger-mnem container"
	docker rm -f jaeger-mnem >/dev/null
fi

if ! docker run -d --name jaeger-mnem \
	-p 16686:16686 -p 4318:4318 \
	-v "$SCRIPT_DIR/jaeger-v2.yaml:/etc/jaeger/config.yaml" \
	-v "$SCRIPT_DIR/jaeger-ui.json:/etc/jaeger/ui.json" \
	jaegertracing/jaeger:latest --config /etc/jaeger/config.yaml >/dev/null; then
	echo "failed to start jaeger-mnem:" >&2
	echo "  pull problems  → check the network, then retry" >&2
	echo "  ports occupied → ss -tlnp | grep -E '16686|4318'" >&2
	exit 1
fi

echo "jaeger-mnem up: UI on http://localhost:16686, OTLP HTTP on :4318"
