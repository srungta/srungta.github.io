# Repository Guidance

This repository is a Jekyll blog. Keep changes focused and preserve existing Liquid, Markdown, SCSS, and shell conventions.

## Development

- Build the Docker image with `./dev.sh build`.
- Run the site at `http://localhost:8080` with `./dev.sh run`.
- Generate editorial SVG covers with `./dev.sh covers`.
- Render browser-accurate social PNGs with `./dev.sh social-images [post ...]`.
- Run `git diff --check` after edits.
- Do not edit generated files under `_site`.

## Posts

- Store published posts under a topic directory in `_posts`.
- Preserve YAML front matter and existing permalink conventions.
- Use `author` IDs from `_data/authors.yml`.
- Keep user-facing examples and claims technically accurate.

## Images

Read [docs/images.md](docs/images.md) before adding or changing post artwork.

- `cover` is the SVG shown on lists and, by default, the post page.
- `banner` is an optional post-page-only visual override.
- `image` is the 1200 x 630 PNG used by social and SEO metadata.
- Posts with artwork should declare both `cover` and `image`.
- Regenerate the PNG whenever its SVG cover changes.
- Do not convert SVG covers with `sips`; use `scripts/render-social-images.mjs`.

## Safety

- Do not commit secrets or credentials.
- Do not overwrite unrelated working-tree changes.
- Do not commit platform metadata such as `.DS_Store`.