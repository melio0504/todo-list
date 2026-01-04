import './styles.css';
import toggleSidebar from './components/toggle-sidebar';
import DialogManager from './components/dialog-manager.js';

// Toggle sidebar
document.querySelector('.menu-toggle').addEventListener('click', toggleSidebar);

// Initialize dialog manager
new DialogManager();
