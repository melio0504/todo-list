import './styles.css';
import toggleSidebar from './toggle-sidebar';
import DialogManager from './dialog-manager.js';

// Toggle sidebar
document.querySelector('.menu-toggle').addEventListener('click', toggleSidebar);

// Initialize dialog manager
new DialogManager();
