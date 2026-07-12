import './styles.css';
import { mountModule0 } from './modules/module0';
import { mountModule05 } from './modules/module05';
import { mountModule1 } from './modules/module1';
import { mountModule2 } from './modules/module2';
import { mountModule3 } from './modules/module3';
import { mountModule4 } from './modules/module4';

type Route = 'module0' | 'module05' | 'module1' | 'module2' | 'module3' | 'module4';

interface RouteConfig {
  label: string;
  slug: string;
  mount: (root: HTMLElement) => () => void;
}

const ROUTES: Record<Route, RouteConfig> = {
  module0: { label: 'Flatland', slug: 'flatland', mount: mountModule0 },
  module05: { label: 'Build Your Own', slug: 'build-your-own', mount: mountModule05 },
  module1: { label: 'Tesseract', slug: 'tesseract', mount: mountModule1 },
  module2: { label: 'Projection', slug: 'projection', mount: mountModule2 },
  module3: { label: 'Rotations', slug: 'rotations', mount: mountModule3 },
  module4: { label: 'Playground', slug: 'playground', mount: mountModule4 },
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
app.appendChild(nav);
app.appendChild(content);

let currentRoute: Route = currentHashRoute();
let disposeCurrent: (() => void) | null = null;

ORDER.forEach((route) => {
  const btn = document.createElement('button');
  btn.textContent = ROUTES[route].label;
  btn.dataset.route = route;
  if (route === currentRoute) btn.classList.add('active');
  btn.addEventListener('click', () => {
    // Setting the hash triggers the hashchange listener, which does the mount.
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

// If the initial hash is missing or unknown, canonicalize it in the URL.
if (window.location.hash.replace(/^#/, '') !== ROUTES[currentRoute].slug) {
  history.replaceState(null, '', `#${ROUTES[currentRoute].slug}`);
}

switchTo(currentRoute);
