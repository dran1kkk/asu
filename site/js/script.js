document.addEventListener('DOMContentLoaded', () => {
  const themeBtn = document.getElementById('theme-btn');
  const savedTheme = localStorage.getItem('ais_theme');

  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('ais_theme', isDark ? 'dark' : 'light');
    });
  }
});