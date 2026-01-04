export default function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');

  if (!sidebar) return;

  sidebar.classList.toggle('hidden');
}
