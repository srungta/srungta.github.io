#!/usr/bin/env bash
# Renames files in a folder (or a single file) by adding/removing the current
# date prefix (yyyy-MM-dd-) from the filename.
#
# Usage:
#   ./make-draft.sh <path>           # Add today's date prefix
#   ./make-draft.sh <path> --remove  # Remove existing date prefix
#
# Examples:
#   ./make-draft.sh _drafts/my-post.md
#   ./make-draft.sh _drafts/
#   ./make-draft.sh _drafts/2024-01-15-my-post.md --remove

set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <file-or-folder> [--remove]" >&2
    exit 1
fi

PATH_ARG="$1"
REMOVE=false
if [[ "${2:-}" == "--remove" ]]; then
    REMOVE=true
fi

CURRENT_DATE=$(date +%Y-%m-%d)
DATE_PATTERN='^[0-9]{4}-[0-9]{2}-[0-9]{2}-'

rename_file() {
    local file="$1"
    local dir
    local name
    dir=$(dirname "$file")
    name=$(basename "$file")

    if [[ "$REMOVE" == true ]]; then
        if [[ "$name" =~ $DATE_PATTERN ]]; then
            local new_name="${name:11}"  # strip leading "yyyy-MM-dd-"
            mv -- "$file" "$dir/$new_name"
            echo "Renamed '$name' -> '$new_name'"
        else
            echo "Skipped '$file': does not start with a date."
        fi
    else
        if [[ "$name" =~ $DATE_PATTERN ]]; then
            echo "Skipped '$file': already starts with a date."
        else
            local new_name="${CURRENT_DATE}-${name}"
            mv -- "$file" "$dir/$new_name"
            echo "Renamed '$name' -> '$new_name'"
        fi
    fi
}

echo "Processing '$PATH_ARG'"

if [[ -f "$PATH_ARG" ]]; then
    rename_file "$PATH_ARG"
elif [[ -d "$PATH_ARG" ]]; then
    find "$PATH_ARG" -maxdepth 1 -type f | sort | while IFS= read -r file; do
        rename_file "$file"
    done
else
    echo "Error: '$PATH_ARG' is not a valid file or directory." >&2
    exit 1
fi
