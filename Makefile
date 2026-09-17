# ============================================================================
#  Taxfix Loop — one-command demo
#
#    make              run the agents, start the server, open the browser
#    make check        28 acceptance checks
#    make live         watch the agents work, paced, in the terminal
#    make stop         stop the server
#
#  Change the port:   make PORT=8080
#  Everything:        make help
# ============================================================================

SHELL  := /bin/bash
NODE   ?= node
PORT   ?= 5173
URL    := http://127.0.0.1:$(PORT)
LOG    := .taxfix-server.log
# Browser opener. Override with `make OPEN=` on a headless or remote machine.
OPEN   ?= $(shell command -v open 2>/dev/null || command -v xdg-open 2>/dev/null)

.DEFAULT_GOAL := demo

.PHONY: demo data serve open stop check live transcript clean push help

## demo — run the agents, start the server, open the browser  (the single command)
demo: data
	@if lsof -ti tcp:$(PORT) >/dev/null 2>&1; then \
		echo "→ already serving on $(URL)"; \
	else \
		echo "→ starting server…"; \
		nohup $(NODE) serve.mjs $(PORT) > $(LOG) 2>&1 & \
		for i in 1 2 3 4 5 6 7 8 9 10; do \
			sleep 0.2; \
			curl -sf -o /dev/null "$(URL)" && break; \
		done; \
	fi
	@$(MAKE) --no-print-directory open
	@echo ""
	@echo "  Taxfix Loop is running at $(URL)"
	@echo "    $(URL)/            landing page"
	@echo "    $(URL)/app.html    the three-screen prototype"
	@echo ""
	@echo "  Straight to a moment:"
	@echo "    $(URL)/app.html?replay=1                  watch the agents work"
	@echo "    $(URL)/app.html?answer=scared#ask         humour switches off"
	@echo "    $(URL)/app.html?repair=mostly-freelance   the repair loop, answered"
	@echo ""
	@echo "  Stop with:   make stop"
	@echo ""

## data — re-run the agent team and rewrite web/data/
data:
	@$(NODE) run-demo.mjs

## serve — run the server in the foreground (Ctrl+C to stop)
serve:
	@$(NODE) serve.mjs $(PORT)

## open — open the prototype in the default browser
open:
	@if [ -n "$(OPEN)" ]; then "$(OPEN)" "$(URL)" >/dev/null 2>&1 || true; \
	else echo "→ open $(URL) in your browser"; fi

## stop — stop the background server
stop:
	@if lsof -ti tcp:$(PORT) >/dev/null 2>&1; then \
		lsof -ti tcp:$(PORT) | xargs kill 2>/dev/null; \
		echo "→ stopped the server on port $(PORT)"; \
	else \
		echo "→ nothing is running on port $(PORT)"; \
	fi

## check — run the 28 acceptance checks (exits non-zero on failure)
check:
	@$(NODE) run-demo.mjs --check

## live — same as a run, but paced so you can watch the team work
live:
	@$(NODE) run-demo.mjs --pace 400

## transcript — print the agent run as a readable timeline
transcript:
	@$(NODE) run-demo.mjs --print

## clean — remove generated data and the server log
clean:
	@rm -rf web/data $(LOG)
	@echo "→ removed web/data and $(LOG). Run 'make' to regenerate."

## push — commit everything and push  (make push m="your message")
push:
	@git add -A
	@git diff --cached --quiet && echo "→ nothing to commit" || \
		git commit -m "$${m:-update}"
	@git push
	@echo "→ pushed"

## help — list every command
help:
	@echo ""
	@echo "  Taxfix Loop — available commands"
	@echo ""
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/^## /  make /' | awk -F' — ' '{printf "%-16s %s\n", $$1, $$2}'
	@echo ""
