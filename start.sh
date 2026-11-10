#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
export PORT

run() {
  /usr/bin/time -p "$@"
}

run npm ci
run rm -rf "$PROJECT_DIR/dist"
run mkdir -p "$PROJECT_DIR/dist"
run cp index.html style.css game.js "$PROJECT_DIR/dist/"
run mkdir -p "${OPENCODE_WEB_DIR:?}"
run node --input-type=module -e '
import { mkdirSync, writeFileSync } from "node:fs";
const output = "/home/runner/work/_temp/omgithub-web/deployment-output.json";
mkdirSync("/home/runner/work/_temp/omgithub-web", { recursive: true });
writeFileSync(output, JSON.stringify({ project: "/home/runner/work/PlayGround/PlayGround", directory: "/home/runner/work/PlayGround/PlayGround/dist" }));
'
run node static-server.mjs
