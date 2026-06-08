export function setupTabs(onTabActivated: (tab: string) => void): void {
  document.querySelectorAll<HTMLElement>('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab!;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll<HTMLElement>('.tab-content').forEach(c => {
        c.style.display = 'none';
      });
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`)!.style.display = '';
      onTabActivated(tab);
    });
  });
}
