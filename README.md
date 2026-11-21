# CursAnimation

Dependency-free custom cursor animation library by [RexxHayanasi](https://cursanimation.rexxhayanasi.cv).

Cursor styles, smooth / delayed / elastic movement, magnetic hover, trails, particles, click ripples, drag feedback and a repeatable scroll-reveal system. Plain CSS and JavaScript, no framework required.

## Install

CDN or local files:

```html
<link rel="stylesheet" href="cursanimation.min.css">
<script src="cursanimation.min.js"></script>
<script>
  CursAnimation.init({
    cursor: "default",
    trail: true,
    particles: true,
    hoverEffects: true,
    clickEffects: true
  });
</script>
```

npm:

```bash
npm install @rexxzyid/cursanimation
```

```javascript
import CursAnimation from "@rexxzyid/cursanimation";
import "@rexxzyid/cursanimation/css";

CursAnimation.init({ cursor: "ring", movement: "elastic", magnetic: true });
```

The stylesheet is required. Without it the overlay has no styling.

## API

| Method | Description |
| --- | --- |
| `init(options?)` | Mounts the cursor. Calling it again replaces the previous instance. |
| `destroy()` | Removes the overlay, listeners, observers and animation loop. |
| `enable()` / `disable()` | Re-attaches or detaches listeners without destroying the instance. |
| `setCursor(type)` | Shortcut for `setOptions({ cursor: type })`. |
| `setOptions(options)` | Merges options into the running instance. Nested objects are merged. |
| `getOptions()` | Returns a copy of the resolved options, or `null` before `init`. |
| `reveal(options?)` | Starts a scroll-reveal instance. Returns `{ refresh(), destroy() }`. |
| `refresh()` | Re-reads the DOM for hover targets, magnetic targets and reveal elements. Call it after rendering new content. |
| `capabilities()` | Reports detected browser features. |
| `version` | Library version string. |

`setOptions`, `setCursor`, `enable` and `disable` throw if `init` has not been called. All methods are safe no-ops during server-side rendering.

Invalid or unknown options throw `RangeError` or `TypeError` instead of being ignored.

## Options

| Option | Default | Values |
| --- | --- | --- |
| `cursor` | `"default"` | `default`, `circle`, `dot`, `ring`, `crosshair`, `minimal`, `image` |
| `imageUrl` | `""` | Required when `cursor` is `image` |
| `imageSize` | `32` | Pixels |
| `imageHotspot` | `[0, 0]` | Pixel offset of the click point inside the image |
| `color` / `color2` | `#7c5cff` / `#22d3ee` | Any CSS colour |
| `size` | `32` | Body diameter in pixels |
| `movement` | `"smooth"` | `instant`, `smooth`, `delayed`, `elastic` |
| `speed` | `0.25` | `0.02` to `1`, follow factor per frame |
| `elastic` | `{ stiffness: 0.12, damping: 0.78 }` | Spring parameters for `elastic` |
| `magnetic` | `{ enabled: false, radius: 90, strength: 0.4 }` | Pulls toward nearby links and buttons |
| `glow` / `neon` / `motionBlur` | `false` | Visual effects |
| `trail` | `{ enabled: false, length: 14, style: "dots", size: 0.6 }` | `style`: `dots`, `gradient`, `neon` |
| `particles` | `{ enabled: false, density: 4, size: 6, lifetime: 800, gravity: 0.04, shape: "dot", max: 120 }` | `shape`: `dot`, `sparkle`, `mixed` |
| `hoverEffects` / `hoverScale` | `true` / `1.8` | Link, button and text transformations |
| `clickEffects` | `{ enabled: true, ripple: true, particles: true, count: 12 }` | Click feedback |
| `dragEffects` | `true` | Drag state after 4px of pressed movement |
| `hideNativeCursor` | `true` | Hidden only while a mouse is active |
| `touch` | `"off"` | `off` or `tap` (tap ripples on touch devices) |
| `respectReducedMotion` | `true` | Disables trail, particles, ripples, blur and easing |
| `selectors` | see source | `link`, `button`, `text`, `ignore` |

Passing `true` for `trail`, `particles`, `clickEffects` or `magnetic` enables them with defaults. Passing an object enables them and overrides the given keys.

`particles` controls ambient trail particles and the shared particle look. Click particles are controlled by `clickEffects.particles`.

Per-element control: `data-ca-hover="link|button|text|none"` forces a hover state, `data-ca-ignore` opts an element out, `data-ca-magnetic` makes any element a magnetic target.

## Scroll reveal

```javascript
CursAnimation.reveal({
  selector: "[data-ca-reveal]",
  once: false,
  threshold: 0.12,
  animation: "fade-up"
});
```

```html
<h2 data-ca-reveal="blur-in">Title</h2>
<ul data-ca-stagger="80">
  <li data-ca-reveal>One</li>
  <li data-ca-reveal>Two</li>
</ul>
```

Animations: `fade`, `fade-up`, `fade-down`, `fade-left` (enters from the left), `fade-right` (enters from the right), `zoom-in`, `scale-up`, `blur-in`.

With `once: false` elements hide when they leave the viewport and play again on every return. Elements without `IntersectionObserver` support are shown immediately. `prefers-reduced-motion` shows everything without animation.

Options: `selector`, `once`, `threshold` (number or array), `animation`, `duration` (ms), `delay` (ms), `stagger` (ms), `distance` (px), `rootMargin`, `root`, `respectReducedMotion`. Elements accept `data-ca-delay` and `data-ca-duration`.

## Browser behaviour

The library uses feature detection, not browser sniffing.

- Pointer Events are used when available, with a mouse and touch fallback.
- Touch pointers hide the custom cursor and restore the native one. `touch: "tap"` adds tap feedback.
- Without `matchMedia` reduced motion cannot be detected, so effects stay on.
- Without `IntersectionObserver` reveal elements are shown immediately.
- `gradient` trail interpolation uses `color-mix()` when supported and falls back to a CSS gradient otherwise.
- The overlay is `pointer-events: none` and never blocks interaction.
- Animation pauses while the tab is hidden and the loop stops when everything has settled.

Automated tests run in jsdom, which verifies logic, lifecycle and fallbacks. They do not replace manual checks in real browsers. Test Chrome, Edge, Firefox, Safari and iOS Safari before relying on specific rendering.

## Development

```bash
npm install
npm run build
npm test
npm run check:comments
```

Output in `dist/`: `cursanimation.js`, `cursanimation.min.js` (global `CursAnimation`), `cursanimation.esm.js`, `cursanimation.esm.min.js`, `cursanimation.cjs`, `cursanimation.css`, `cursanimation.min.css`.

## Acknowledgements

CursAnimation was started from a review of [Swarm Rebuild](https://github.com/califa/swarm-site), itself a tribute to the Swarm site by [Joel Califa](https://joelcalifa.com). That project is published without a license, so no code, assets or cursor artwork from it are included here. All code in this repository is original.

## License

MIT, see [LICENSE](LICENSE).
