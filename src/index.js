import './styles.css';
import toggleSidebar from './components/toggle-sidebar';
import DialogManager from './managers/dialog-manager.js';

function initializeApp() {
  const menuToggle = document.querySelector('.menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', toggleSidebar);
  } else {
    console.warn('Menu toggle button not found');
  }

  try {
    new DialogManager();
  } catch (error) {
    console.error('Failed to initialize DialogManager:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
