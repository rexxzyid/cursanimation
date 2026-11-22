# CursAnimation

Dependency-free custom cursor and scroll-rebuild animation library.

## Install

CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rexxzyid/cursanimation@v1.5.4/dist/cursanimation.min.css">
<script src="https://cdn.jsdelivr.net/gh/rexxzyid/cursanimation@v1.5.4/dist/cursanimation.min.js"></script>
```

npm:

```bash
npm install @rexxzyid/cursanimation
```

```javascript
import CursAnimation from "@rexxzyid/cursanimation";
import "@rexxzyid/cursanimation/css";
```

## Cursor

```javascript
CursAnimation.init({
  cursor: "ring",
  color: "#f3f0e8",
  color2: "#ffd84d",
  size: 32,
  movement: "elastic",
  magnetic: { enabled: true, radius: 90, strength: 0.35 },
  swarm: { enabled: true, count: 12, radius: 150 },
  hoverEffects: true,
  clickEffects: { enabled: true }
});
```

Main options: `cursor`, `color`, `color2`, `size`, `movement`, `magnetic`, `swarm`, `trail`, `particles`, `hoverEffects`, `clickEffects`, `touch`, `respectReducedMotion`.

## Rebuild on scroll

Hides matching elements, draws an outline, types their text, traces media with a pen cursor, then reveals them. Remove the reveal class when the element leaves the viewport to replay it.

```html
<section class="reveal">...</section>
<style>.reveal { opacity: 0; } .reveal.visible { opacity: 1; }</style>
```

```javascript
CursAnimation.rebuild({
  selector: ".reveal",
  revealClass: "visible",
  threshold: 0.14,
  duration: 440,
  agents: 2,
  color: "auto",
  autoDark: "#111111",
  autoLight: "#f3f0e8",
  typeText: true,
  typeSelector: "h1,h2,h3,p",
  charDelay: 9,
  maxTypeDuration: 980,
  pen: true,
  stagger: 60,
  maxConcurrent: 2
});
```

Useful options: `selector`, `revealClass`, `once`, `threshold`, `duration`, `agents`, `color` (`"auto"` or a CSS color), `autoDark`, `autoLight`, `colors`, `label`, `stagger`, `maxConcurrent`, `typeText`, `typeSelector`, `charDelay`, `maxTypeDuration`, `pen`, `rootMargin`.

## API

`init`, `destroy`, `enable`, `disable`, `setOptions`, `setCursor`, `getOptions`, `reveal`, `rebuild`, `refresh`, `capabilities`, `version`.

The stylesheet is required. Call `refresh()` after adding new DOM.

## License

MIT
