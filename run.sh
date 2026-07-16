#!/usr/bin/env bash
set -euo pipefail

# Run the site
docker run --rm \
  -v "${PWD}:/srv/jekyll" \
  -p 8080:4000 \
  -e JEKYLL_ENV=production \
  -it jekyll/minimal:3.8 \
  jekyll serve --force_polling
