# Images

Post images have three explicit responsibilities. Do not reuse a field for a different responsibility.

## Front matter

### `cover`

The standard visible artwork for a post. It appears in home-page and post-list thumbnails and at the top of the post when there is no `banner` override.

Use a 1200 x 630 SVG:

```yaml
cover: /assets/images/WEB/WEB-02/cover.svg
```

### `banner`

An optional override shown only at the top of the post page. It exists for posts that need different artwork on listing pages and the post page. It does not affect social metadata.

```yaml
cover: /assets/images/WEB/WEB-03/cover.svg
banner: /assets/images/WEB/WEB-03/banner.png
```

### `image`

The raster social-sharing image consumed by `jekyll-seo-tag`. It supplies Open Graph and Twitter card metadata. LinkedIn and other crawlers do not reliably support SVG social images, so use a 1200 x 630 PNG.

```yaml
image: /assets/images/WEB/WEB-02/cover.png
```

The normal declaration is:

```yaml
cover: /assets/images/TOPIC/POST-ID/cover.svg
image: /assets/images/TOPIC/POST-ID/cover.png
```

| Surface | Image selection |
| --- | --- |
| Home page and post lists | `cover` |
| Post page | `banner`, falling back to `cover` |
| Social previews | `image` |

## Creating SVG covers

Generated editorial covers are defined in `scripts/generate-covers.mjs`. Add a cover entry with its path, eyebrow, title lines, accent, and motif, then run:

```shell
node scripts/generate-covers.mjs
```

The generator writes 1200 x 630 SVG files under `assets/images`. Covers with bespoke artwork may be authored directly, but should retain the same dimensions and include an accessible `<title>` and `<desc>`.

## Creating social PNGs

Render every declared `cover` into its matching `image`:

```shell
node scripts/render-social-images.mjs
```

Render one or more posts while editing:

```shell
node scripts/render-social-images.mjs _posts/WEB/2026-03-04-WEB-02-internet-duct-tape.md
```

The script uses headless Google Chrome or Microsoft Edge at a device scale factor of 1. This produces the same text layout and SVG rendering as a browser at exactly 1200 x 630 pixels. Do not use macOS `sips` for SVG conversion; it does not render SVG `<tspan>` line positioning correctly.

Chrome is discovered automatically on macOS, Linux, and Windows. Set `CHROME_PATH` when the browser executable is installed elsewhere:

```shell
CHROME_PATH=/path/to/chrome node scripts/render-social-images.mjs
```

Commit both the SVG and PNG. After deployment, use the LinkedIn Post Inspector to refresh LinkedIn's cached preview.

## Validation

Check front matter and assets by running the PNG renderer for the changed post. Also build the production site when Docker is available:

```shell
./dev.sh build
```

Inspect the generated post HTML and confirm that `og:image` is an absolute URL ending in `.png`.