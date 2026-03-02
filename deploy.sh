#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  Scholars System — Frontend Deploy & Manage
#  Usage:  ./deploy.sh [command] [options]
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_MODULES_DIR="$PROJECT_DIR/node_modules"
DIST_DIR="$PROJECT_DIR/dist"
PID_FILE="$PROJECT_DIR/.service.pid"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/server.log"
VERSION=$(grep '^[[:space:]]*"version"' "$PROJECT_DIR/package.json" 2>/dev/null \
    | head -1 | sed 's/.*"\([^"]*\)".*/\1/' || echo "0.0.0")

PORT=5173
PROD_PORT=3000
TAIL_LINES=50
FOLLOW=false
PRODUCTION=false
USE_SERVE=false

# ── ANSI ──────────────────────────────────────────────────────
R='\033[0;31m';   G='\033[0;32m';  Y='\033[0;33m'
B='\033[0;34m';   M='\033[0;35m';  C='\033[0;36m'
W='\033[0;37m';   D='\033[0;90m';  BOLD='\033[1m'
BW='\033[1;97m';  BC='\033[1;36m'
BG_G='\033[42;30m'; BG_R='\033[41;37m'; BG_Y='\033[43;30m'; BG_B='\033[44;37m'
NC='\033[0m'
# 256-color gradient (violet → cyan)
P1='\033[38;5;57m'; P2='\033[38;5;63m'; P3='\033[38;5;69m'
P4='\033[38;5;75m'; P5='\033[38;5;81m'; P6='\033[38;5;87m'

# ── Utilities ─────────────────────────────────────────────────
_hr()  { printf "${D}"; printf '─%.0s' $(seq 1 60); printf "${NC}\n"; }
_pad() { printf "%-${1}s" "$2"; }

ok()   { printf " ${G}✓${NC}  %b\n" "$*"; }
warn() { printf " ${Y}!${NC}  %b\n" "$*"; }
fail() { printf " ${R}✗${NC}  %b\n" "$*"; }
dim()  { printf " ${D}%b${NC}\n" "$*"; }

spinner() {
    local pid=$1 msg="$2"
    local chars='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local i=0
    while kill -0 "$pid" 2>/dev/null; do
        printf "\r ${C}%s${NC} %s" "${chars:i%10:1}" "$msg"
        i=$((i + 1))
        sleep 0.1
    done
    printf "\r\033[2K"
}

# ── Header ────────────────────────────────────────────────────
show_banner() {
    printf "\n"
    printf "  ${P1}${BOLD}███████╗ ██████╗██╗  ██╗ ██████╗ ${NC}\n"
    printf "  ${P2}${BOLD}██╔════╝██╔════╝██║  ██║██╔═══██╗${NC}\n"
    printf "  ${P3}${BOLD}███████╗██║     ███████║██║   ██║${NC}\n"
    printf "  ${P4}${BOLD}╚════██║██║     ██╔══██║██║   ██║${NC}\n"
    printf "  ${P5}${BOLD}███████║╚██████╗██║  ██║╚██████╔╝${NC}\n"
    printf "  ${P6}${BOLD}╚══════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ ${NC}\n"
    printf "\n"
    printf "  ${P3}%s${NC}\n" "$(printf '%.0s═' {1..56})"
    printf "  ${P2}${BOLD}Scholars System${NC} ${D}·${NC} ${D}Frontend Service${NC}\n"
    printf "  ${P3}%s${NC}\n" "$(printf '%.0s═' {1..56})"
    printf "\n"
    local _branch _node _time
    _branch=$(git branch --show-current 2>/dev/null || echo 'unknown')
    _node=$(node --version 2>/dev/null || echo 'N/A')
    _time=$(date '+%Y-%m-%d  %H:%M:%S')
    printf "  ${D}TIME${NC}   ${BW}%s${NC}    ${D}PORT${NC}   ${BC}${BOLD}:%s${NC}\n" "$_time" "$PORT"
    printf "  ${D}BRANCH${NC} ${Y}%s${NC}          ${D}NODE${NC}   ${G}%s${NC}\n" "$_branch" "$_node"
    printf "  ${D}VERSION${NC} ${D}v%s${NC}\n" "$VERSION"
    printf "\n"
    _hr
}

# ── Environment ───────────────────────────────────────────────
validate_node() {
    node -v &>/dev/null || return 1
    local ver
    ver=$(node -v | sed 's/v\([0-9]*\).*/\1/')
    [[ $ver -ge 18 ]] && return 0
    return 1
}

get_node_ver() {
    node -v 2>/dev/null | sed 's/^v//' || echo "?"
}

validate_npm() {
    npm -v &>/dev/null && return 0
    return 1
}

check_node_modules() {
    [[ -d "$NODE_MODULES_DIR" && -f "$PROJECT_DIR/node_modules/.package-lock.json" ]]
}

install_deps() {
    cd "$PROJECT_DIR"
    npm install 2>&1 | tail -1 &
    local pid=$!
    spinner $pid "Installing dependencies..."
    wait $pid 2>/dev/null
    return ${PIPESTATUS[0]:-0}
}

validate_env_file() {
    if [[ ! -f "$PROJECT_DIR/.env.local" ]]; then
        [[ -f "$PROJECT_DIR/.env.example" ]] && cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env.local"
        return 0
    fi
}

ensure_dirs() {
    mkdir -p "$LOG_DIR"
}

# ── Git ───────────────────────────────────────────────────────
do_git_pull() {
    cd "$PROJECT_DIR"
    if ! git rev-parse --is-inside-work-tree &>/dev/null; then
        warn "Not a git repo — skipping pull"
        return 0
    fi
    local branch
    branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    local before
    before=$(git rev-parse HEAD 2>/dev/null)

    printf " ${C}⟳${NC}  Pulling latest code ${D}(%s)${NC}..." "$branch"
    if git pull --ff-only -q 2>/dev/null; then
        local after
        after=$(git rev-parse HEAD 2>/dev/null)
        if [[ "$before" == "$after" ]]; then
            printf "\r ${G}✓${NC}  Code is up-to-date ${D}(%s)${NC}        \n" "$branch"
        else
            local count
            count=$(git rev-list "$before".."$after" --count 2>/dev/null || echo "?")
            printf "\r ${G}✓${NC}  Pulled ${BOLD}%s${NC} new commit(s) ${D}(%s)${NC}       \n" "$count" "$branch"
        fi
    else
        printf "\r ${Y}!${NC}  Pull failed — continuing with local code\n"
    fi
}

# ── Build ─────────────────────────────────────────────────────
do_build() {
    cd "$PROJECT_DIR"
    printf " ${C}⚙${NC}  Building production bundle..."
    if npm run build 2>&1 | tail -1 &
    then
        local pid=$!
        spinner $pid "Building..."
        wait $pid 2>/dev/null
    fi

    if [[ ! -d "$DIST_DIR" ]]; then
        fail "Build failed — dist/ not created"
        return 1
    fi

    local dist_size
    dist_size=$(du -sh "$DIST_DIR" | cut -f1)
    ok "Build complete ${D}(dist: $dist_size)${NC}"
    return 0
}

# ── Service ───────────────────────────────────────────────────
_is_running() {
    [[ -f "$PID_FILE" ]] || return 1
    local pid; pid=$(cat "$PID_FILE")
    kill -0 "$pid" 2>/dev/null && return 0
    rm -f "$PID_FILE"
    return 1
}

_get_pid() { cat "$PID_FILE" 2>/dev/null || echo ""; }

_pids_on_port() {
    if command -v lsof &>/dev/null; then
        lsof -ti "tcp:$1" 2>/dev/null || true
    else
        netstat -tlnp 2>/dev/null | grep ":$1 " | awk '{print $7}' | cut -d'/' -f1 || true
    fi
}

_free_port() {
    local target_port=$1
    local pids; pids=$(_pids_on_port "$target_port")
    [[ -z "$pids" ]] && return 0
    echo "$pids" | xargs kill 2>/dev/null || true
    sleep 2
    pids=$(_pids_on_port "$target_port")
    [[ -n "$pids" ]] && { echo "$pids" | xargs kill -9 2>/dev/null || true; sleep 1; }
    pids=$(_pids_on_port "$target_port")
    [[ -n "$pids" ]] && { fail "Cannot free port $target_port"; return 1; }
    return 0
}

_stop_service() {
    if ! _is_running; then
        _free_port "$PORT" 2>/dev/null || true
        return 0
    fi
    local pid; pid=$(_get_pid)
    kill -- -"$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
    local w=0
    while kill -0 "$pid" 2>/dev/null && [[ $w -lt 10 ]]; do sleep 1; w=$((w+1)); done
    kill -0 "$pid" 2>/dev/null && { kill -9 -- -"$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true; }
    rm -f "$PID_FILE"
    _free_port "$PORT" 2>/dev/null || true
}

_start_dev_server() {
    ensure_dirs
    _free_port "$PORT" || return 1
    rm -f "$PID_FILE"

    cd "$PROJECT_DIR"
    nohup npm run dev >> "$LOG_FILE" 2>&1 &

    echo $! > "$PID_FILE"
    sleep 2
    kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

_start_serve() {
    ensure_dirs
    _free_port "$PROD_PORT" || return 1
    rm -f "$PID_FILE"

    cd "$PROJECT_DIR"
    nohup npx serve -s "$DIST_DIR" -l "$PROD_PORT" >> "$LOG_FILE" 2>&1 &

    echo $! > "$PID_FILE"
    sleep 2
    kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

_wait_health() {
    local target_port=$1
    local max=30 i=0
    local chars='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    printf " ${C}⟳${NC} Waiting for server..."
    while [[ $i -lt $max ]]; do
        if curl -sf "http://localhost:$target_port/" >/dev/null 2>&1; then
            printf "\r ${G}✓${NC}  Server is ready           \n"
            return 0
        fi
        printf "\r ${C}%s${NC} Waiting for server..." "${chars:i%10:1}"
        sleep 1
        i=$((i+1))
    done
    printf "\r ${Y}!${NC}  Server startup timeout (%ss)     \n" "$max"
    return 1
}

# ── Dashboard ─────────────────────────────────────────────────
show_dashboard() {
    local pid etime cpu mem_kb mem_mb conns log_size
    printf "\n"
    printf " ${BOLD}${C}◆ Dashboard${NC}\n"
    _hr

    if _is_running; then
        pid=$(_get_pid)
        etime=$(ps -p "$pid" -o etime= 2>/dev/null | xargs || echo "-")
        cpu=$(ps -p "$pid" -o %cpu= 2>/dev/null | xargs || echo "-")
        mem_kb=$(ps -p "$pid" -o rss= 2>/dev/null | xargs || echo "0")
        mem_mb=$(echo "$mem_kb" | awk '{printf "%.1f", $1/1024}')
        conns=$(lsof -i "tcp:$PORT" 2>/dev/null | grep -c ESTABLISHED || echo "0")

        printf "\n"
        printf "   ${BOLD}SERVICE${NC}\n"
        printf "   %-18s ${G}● Running${NC}\n" "Status"
        printf "   %-18s %s\n" "PID" "$pid"
        printf "   %-18s %s\n" "Port" "$PORT"
        printf "   %-18s %s\n" "Uptime" "$etime"
        printf "\n"
        printf "   ${BOLD}RESOURCES${NC}\n"
        printf "   %-18s %s%%\n" "CPU" "$cpu"
        printf "   %-18s %s MB\n" "Memory" "$mem_mb"
        printf "   %-18s %s\n" "Connections" "$conns"

        if [[ -f "$LOG_FILE" ]]; then
            log_size=$(du -h "$LOG_FILE" | cut -f1 | xargs)
            printf "   %-18s %s\n" "Log size" "$log_size"
        fi

        # Endpoints
        printf "\n"
        printf "   ${BOLD}ENDPOINTS${NC}\n"
        printf "   ${D}Frontend${NC} http://localhost:%s\n" "$PORT"
        printf "   ${D}API${NC}      http://43.98.254.243:8001\n"
    else
        printf "\n"
        printf "   ${BOLD}SERVICE${NC}\n"
        printf "   %-18s ${R}● Stopped${NC}\n" "Status"
        if [[ -f "$LOG_FILE" ]]; then
            log_size=$(du -h "$LOG_FILE" | cut -f1 | xargs)
            printf "   %-18s %s\n" "Log size" "$log_size"
        fi
    fi

    printf "\n"
    _hr
}

# ── Commands ──────────────────────────────────────────────────
cmd_deploy() {
    PRODUCTION=true
    show_banner

    printf "\n ${BOLD}${C}◆ Deploy (Production)${NC}\n"
    _hr
    printf "\n"

    # 1. Git pull
    do_git_pull

    # 2. Node.js
    if validate_node; then
        ok "Node.js $(get_node_ver)"
    else
        fail "Node.js >= 18 required (found $(get_node_ver))"
        return 1
    fi

    # 3. npm
    if validate_npm; then
        ok "npm $(npm -v)"
    else
        fail "npm not found"
        return 1
    fi

    # 4. .env.local
    validate_env_file
    if [[ -f "$PROJECT_DIR/.env.local" ]]; then
        ok "Environment file ${D}.env.local${NC}"
    else
        warn ".env.local not found — using defaults"
    fi

    # 5. Dependencies
    if ! check_node_modules; then
        local t0; t0=$(date +%s)
        if install_deps; then
            ok "Dependencies installed ${D}$(($(date +%s) - t0))s${NC}"
        else
            fail "npm install failed"
            return 1
        fi
    else
        ok "Dependencies already installed"
    fi

    # 6. Build
    if do_build; then
        :
    else
        fail "Build failed"
        return 1
    fi

    # 7. Service
    printf "\n"
    if _is_running; then
        local old_pid; old_pid=$(_get_pid)
        printf " ${Y}⟳${NC}  Restarting service ${D}(was PID %s)${NC}...\n" "$old_pid"
        _stop_service
        sleep 1
    fi

    if _start_serve; then
        ok "Service started ${D}PID $(cat "$PID_FILE")${NC}"
    else
        fail "Service failed to start — check logs/$LOG_FILE"
        return 1
    fi

    # 8. Health
    _wait_health "$PROD_PORT" || true

    # Dashboard
    show_dashboard

    printf " ${G}${BOLD}Deploy complete.${NC}\n\n"
    dim "  ./deploy.sh status    View dashboard"
    dim "  ./deploy.sh logs -f   Follow logs"
    dim "  ./deploy.sh stop      Stop service"
    printf "\n"
}

cmd_init() {
    show_banner

    printf "\n ${BOLD}${C}◆ Initialize${NC}\n"
    _hr
    printf "\n"

    if validate_node; then
        ok "Node.js $(get_node_ver)"
    else
        fail "Node.js >= 18 required"; return 1
    fi

    if validate_npm; then
        ok "npm"
    else
        fail "npm not found"; return 1
    fi

    validate_env_file
    ok "Environment file"

    local t0; t0=$(date +%s)
    if install_deps; then
        ok "Dependencies ${D}$(($(date +%s) - t0))s${NC}"
    else
        fail "npm install failed"
        return 1
    fi

    ensure_dirs
    ok "Log directory"

    printf "\n"
    _hr
    printf "\n ${G}${BOLD}Init complete.${NC} Next:\n\n"
    dim "  vi .env.local         Edit config (optional)"
    dim "  ./deploy.sh dev       Start dev server"
    dim "  ./deploy.sh deploy    Full production deploy"
    printf "\n"
}

cmd_dev() {
    show_banner

    if ! check_node_modules; then
        fail "Dependencies not installed. Run: ./deploy.sh init"
        return 1
    fi

    if _is_running; then
        warn "Already running (PID $(_get_pid))"
        show_dashboard
        return 0
    fi

    printf " ${C}⟳${NC}  Starting development server (http://localhost:$PORT)...\n"

    if _start_dev_server; then
        ok "Dev server started ${D}PID $(cat "$PID_FILE")${NC}"
        _wait_health "$PORT" || true
        show_dashboard
    else
        fail "Failed to start — check $LOG_FILE"
    fi
}

cmd_start() {
    show_banner

    if ! check_node_modules; then
        fail "Dependencies not installed. Run: ./deploy.sh init"
        return 1
    fi

    if _is_running; then
        warn "Already running (PID $(_get_pid))"
        show_dashboard
        return 0
    fi

    PRODUCTION=true
    printf " ${C}⟳${NC}  Starting production server (http://localhost:$PROD_PORT)...\n"

    if [[ ! -d "$DIST_DIR" ]]; then
        warn "dist/ not found — building..."
        if ! do_build; then
            fail "Build failed"
            return 1
        fi
    fi

    if _start_serve; then
        ok "Service started ${D}PID $(cat "$PID_FILE")${NC}"
        _wait_health "$PROD_PORT" || true
        show_dashboard
    else
        fail "Failed to start — check $LOG_FILE"
    fi
}

cmd_build() {
    show_banner

    if ! check_node_modules; then
        fail "Dependencies not installed. Run: ./deploy.sh init"
        return 1
    fi

    printf "\n ${BOLD}${C}◆ Build${NC}\n"
    _hr
    printf "\n"

    if do_build; then
        printf "\n"
        _hr
        printf "\n ${G}${BOLD}Build complete.${NC}\n\n"
        dim "  ./deploy.sh start     Start production server"
        printf "\n"
    else
        return 1
    fi
}

cmd_stop() {
    show_banner

    if ! _is_running; then
        local orphans; orphans=$(_pids_on_port "$PORT")
        if [[ -n "$orphans" ]]; then
            warn "No PID file, but port $PORT occupied"
            _free_port "$PORT"
            ok "Port freed"
        else
            dim "Service is not running."
        fi
        return 0
    fi

    local pid; pid=$(_get_pid)
    printf " ${C}⟳${NC}  Stopping service (PID %s)...\n" "$pid"
    _stop_service
    ok "Service stopped"
}

cmd_restart() {
    show_banner

    if ! check_node_modules; then
        fail "Dependencies not installed. Run: ./deploy.sh init"
        return 1
    fi

    PRODUCTION=true

    if _is_running; then
        local pid; pid=$(_get_pid)
        printf " ${C}⟳${NC}  Restarting (PID %s)...\n" "$pid"
        _stop_service
        sleep 1
    fi

    if _start_serve; then
        ok "Service started ${D}PID $(cat "$PID_FILE")${NC}"
        _wait_health "$PROD_PORT" || true
        show_dashboard
    else
        fail "Failed to start — check $LOG_FILE"
    fi
}

cmd_status() {
    show_banner
    show_dashboard
}

cmd_logs() {
    if [[ ! -f "$LOG_FILE" ]]; then
        warn "Log file not found: $LOG_FILE"
        return 0
    fi
    if [[ "$FOLLOW" == "true" ]]; then
        dim "Tailing $LOG_FILE (Ctrl+C to stop)"
        printf "\n"
        tail -n "$TAIL_LINES" -f "$LOG_FILE"
    else
        tail -n "$TAIL_LINES" "$LOG_FILE"
    fi
}

cmd_help() {
    show_banner
    printf " ${BOLD}Usage${NC}  ./deploy.sh ${D}[command] [options]${NC}\n\n"

    printf " ${BOLD}Commands${NC}\n\n"
    printf "   ${G}deploy${NC}     Full deploy: pull → install → build → start  ${D}(default)${NC}\n"
    printf "   ${G}init${NC}       Initialize environment only\n"
    printf "   ${G}dev${NC}        Start Vite development server\n"
    printf "   ${G}build${NC}      Build production bundle\n"
    printf "   ${G}start${NC}      Start production server (serve)\n"
    printf "   ${G}stop${NC}       Stop service\n"
    printf "   ${G}restart${NC}    Restart service\n"
    printf "   ${G}status${NC}     Show dashboard\n"
    printf "   ${G}logs${NC}       View logs ${D}(-f to follow)${NC}\n"
    printf "   ${G}help${NC}       This message\n"

    printf "\n ${BOLD}Options${NC}\n\n"
    printf "   --tail N          Log lines ${D}(default: %s)${NC}\n" "$TAIL_LINES"
    printf "   -f, --follow      Follow log output\n"

    printf "\n ${BOLD}Examples${NC}\n\n"
    printf "   ${D}\$${NC} ./deploy.sh              ${D}# one-command deploy (production)${NC}\n"
    printf "   ${D}\$${NC} ./deploy.sh dev           ${D}# start dev server${NC}\n"
    printf "   ${D}\$${NC} ./deploy.sh logs -f       ${D}# follow logs${NC}\n"
    printf "   ${D}\$${NC} ./deploy.sh status        ${D}# view dashboard${NC}\n"
    printf "\n"
}

# ── Parse Args ────────────────────────────────────────────────
COMMAND="${1:-deploy}"
shift 2>/dev/null || true

while [[ $# -gt 0 ]]; do
    case "$1" in
        --tail)       TAIL_LINES="$2"; shift 2 ;;
        --follow|-f)  FOLLOW=true; shift ;;
        *) fail "Unknown option: $1"; cmd_help; exit 1 ;;
    esac
done

case "$COMMAND" in
    deploy)         cmd_deploy ;;
    init)           cmd_init ;;
    dev)            cmd_dev ;;
    build)          cmd_build ;;
    start)          cmd_start ;;
    stop)           cmd_stop ;;
    restart)        cmd_restart ;;
    status)         cmd_status ;;
    logs)           cmd_logs ;;
    help|--help|-h) cmd_help ;;
    *)              fail "Unknown: $COMMAND"; cmd_help; exit 1 ;;
esac
