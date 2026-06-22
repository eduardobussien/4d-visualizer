import './styles.css';
import { mountModule0 } from './modules/module0';
import { mountModule05 } from './modules/module05';

type Route = 'module0' | 'module05';

const ROUTES: Record<Route, { label: string; mount: (root: HTMLElement) => () => void }> = {
  module0: { label: 'Module 0 — Flatland', mount: mountModule0 },
  module05: { label: 'Module 0.5 — Build Your Own', mount: mountModule05 },
};

const app = document.getElementById('app');
if (!app) throw new Error('#app element not found');

const nav = document.createElement('nav');
nav.className = 'tabs';
const content = document.createElement('div');
content.className = 'route-content';
app.appendChild(nav);
app.appendChild(content);

let currentRoute: Route = 'module0';
let disposeCurrent: (() => void) | null = null;

(Object.keys(ROUTES) as Route[]).forEach((route) => {
  const btn = document.createElement('button');
  btn.textContent = ROUTES[route].label;
  btn.dataset.route = route;
  if (route === currentRoute) btn.classList.add('active');
  btn.addEventListener('click', () => switchTo(route));
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

switchTo(currentRoute);
