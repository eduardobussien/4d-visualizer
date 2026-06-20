import './styles.css';
import { mountModule0 } from './modules/module0';

const app = document.getElementById('app');
if (!app) throw new Error('#app element not found');
mountModule0(app);
