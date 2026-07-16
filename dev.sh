#!/usr/bin/env bash
# Dev helper script. Usage: ./dev.sh <command> [options]
#
# Examples:
#   ./dev.sh build
#   ./dev.sh run
#   ./dev.sh draft _drafts/my-post.md
#   ./dev.sh draft _drafts --remove
#   ./dev.sh git-setup

set -euo pipefail

cmd_build() {
    docker build --platform linux/amd64 . -t srungtagithub:debug
}

cmd_run() {
    docker run --rm --platform linux/amd64 -v "${PWD}:/srv/jekyll" -p 8080:4000 -e JEKYLL_ENV=production -it jekyll/minimal:3.8 jekyll serve --force_polling
}

cmd_draft() {
    local path="${1:-}"
    local remove=false
    shift 1 2>/dev/null || true
    for arg in "$@"; do [[ "$arg" == "--remove" ]] && remove=true; done

    [[ -z "$path" ]] && { echo "Error: path required.  Usage: ./dev.sh draft <path> [--remove]"; exit 1; }

    local current_date
    current_date=$(date +"%Y-%m-%d")

    rename_file() {
        local file="$1"
        local name
        name=$(basename "$file")
        if $remove; then
            if [[ "$name" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}-(.+)$ ]]; then
                mv "$file" "$(dirname "$file")/${BASH_REMATCH[1]}"
                echo "Renamed '$name' -> '${BASH_REMATCH[1]}'"
            else
                echo "Skipped '$name', no date prefix found."
            fi
        else
            if [[ "$name" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}- ]]; then
                echo "Skipped '$name', already has a date prefix."
            else
                mv "$file" "$(dirname "$file")/${current_date}-${name}"
                echo "Renamed '$name' -> '${current_date}-${name}'"
            fi
        fi
    }

    if [[ -f "$path" ]]; then
        rename_file "$path"
    elif [[ -d "$path" ]]; then
        find "$path" -maxdepth 1 -type f | while read -r f; do rename_file "$f"; done
    else
        echo "Error: '$path' is not a valid file or directory."; exit 1
    fi
}

cmd_git_setup() {
    git config user.name "Shaswat Rungta"
    git config user.email "shaswatrungta@hotmail.com"
    echo "Git user config updated."
}

cmd_init() {
    local script_path
    script_path="$(cd "$(dirname "$0")" && pwd)/dev.sh"
    local eval_line="eval \"\$(${script_path} completion)\""
    local zshrc="$HOME/.zshrc"

    if grep -qF "$script_path" "$zshrc" 2>/dev/null; then
        echo "Already set up in $zshrc — nothing to do."
    else
        echo "" >> "$zshrc"
        echo "# dev.sh tab completion" >> "$zshrc"
        echo "$eval_line" >> "$zshrc"
        echo "Added completion to $zshrc. Run 'source ~/.zshrc' to activate."
    fi
}

cmd_completion() {
    cat <<'EOF'
_dev_sh_completion() {
    local commands=(build run draft git-setup)
    local cur="${words[CURRENT]}"
    if (( CURRENT == 2 )); then
        compadd -a commands
    elif (( CURRENT >= 3 )) && [[ "${words[2]}" == "draft" ]]; then
        case "$cur" in
            --*) compadd -- --remove ;;
            *)   _files ;;
        esac
    fi
}
compdef _dev_sh_completion dev.sh
EOF
}

# --- dispatch ---
command="${1:-}"
shift 1 2>/dev/null || true

case "$command" in
    build)      cmd_build ;;
    run)        cmd_run ;;
    draft)      cmd_draft "$@" ;;
    git-setup)  cmd_git_setup ;;
    init)       cmd_init ;;
    completion) cmd_completion ;;
    *)
        echo "Unknown command '${command}'. Available: build, run, draft, git-setup"
        exit 1
        ;;
esac
