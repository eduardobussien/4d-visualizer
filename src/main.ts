import './styles.css';
import { mountModule0 } from './modules/module0';
import { mountModule05 } from './modules/module05';
import { mountModule1 } from './modules/module1';
import { mountModule2 } from './modules/module2';
import { mountModule4 } from './modules/module4';

type Route = 'module0' | 'module05' | 'module1' | 'module2' | 'module4';

interface RouteConfig {
  label: string;
  slug: string;
  hint: string;
  mount: (root: HTMLElement) => () => void;
}

const ROUTES: Record<Route, RouteConfig> = {
  module0: {
    label: 'Flatland',
    slug: 'flatland',
    hint: 'Start here. A 3D shape passing through a 2D plane, so a flat being can only ever see the slice.',
    mount: mountModule0,
  },
  module05: {
    label: 'Build & Raise',
    slug: 'build-and-raise',
    hint: 'Draw or pick a 2D shape. Watch the same operation lift it into 3D, then into 4D.',
    mount: mountModule05,
  },
  module1: {
    label: 'Tesseract',
    slug: 'tesseract',
    hint: 'A real 4D shape passing through 3D space. The slice morphs as the shape rotates.',
    mount: mountModule1,
  },
  module2: {
    label: 'Projection',
    slug: 'projection',
    hint: 'The other way to see 4D: a "shadow" in 3D, with hue encoding the collapsed dimension.',
    mount: mountModule2,
  },
  module4: {
    label: 'Playground',
    slug: 'playground',
    hint: 'Everything together. Any of four 4D shapes, slice or shadow, all six rotation planes.',
    mount: mountModule4,
  },
};

const ORDER = Object.keys(ROUTES) as Route[];
const DEFAULT_ROUTE: Route = 'module0';

function slugToRoute(slug: string): Route | null {
  const entry = ORDER.find((r) => ROUTES[r].slug === slug);
  return entry ?? null;
}

function currentHashRoute(): Route {
  const slug = window.location.hash.replace(/^#/, '');
  return slugToRoute(slug) ?? DEFAULT_ROUTE;
}

const app = document.getElementById('app');
if (!app) throw new Error('#app element not found');

const nav = document.createElement('nav');
nav.className = 'tabs';
const content = document.createElement('div');
content.className = 'route-content';
const footer = document.createElement('footer');
footer.className = 'site-footer';
footer.innerHTML =
  'built by <a href="https://github.com/eduardobussien" target="_blank" rel="noopener">Eduardo Bussien</a> · <a href="https://github.com/eduardobussien/4d-visualizer" target="_blank" rel="noopener">source on GitHub</a>';
app.appendChild(nav);
app.appendChild(content);
app.appendChild(footer);

let currentRoute: Route = currentHashRoute();
let disposeCurrent: (() => void) | null = null;

ORDER.forEach((route) => {
  const btn = document.createElement('button');
  btn.textContent = ROUTES[route].label;
  btn.dataset.route = route;
  btn.title = ROUTES[route].hint;
  if (route === currentRoute) btn.classList.add('active');
  btn.addEventListener('click', () => {
    window.location.hash = ROUTES[route].slug;
  });
  nav.appendChild(btn);
});

function switchTo(route: Route): void {
  if (route === currentRoute && disposeCurrent) return;
  if (disposeCurrent) disposeCurrent();
  currentRoute = route;
  nav.querySelectorAll('button').forEach((b) =>
    b.classList.toggle('active', (b as HTMLButtonElement).dataset.route === route),
  );
  disposeCurrent = ROUTES[route].mount(content);
}

window.addEventListener('hashchange', () => {
  switchTo(currentHashRoute());
});

if (window.location.hash.replace(/^#/, '') !== ROUTES[currentRoute].slug) {
  history.replaceState(null, '', `#${ROUTES[currentRoute].slug}`);
}

switchTo(currentRoute);
