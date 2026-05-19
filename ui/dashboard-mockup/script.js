(function () {
  const updated = document.getElementById('lastUpdated');
  const now = new Date();
  updated.textContent = `Updated: ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const bars = [45, 62, 58, 80, 66, 40, 52, 74];
  const chart = document.getElementById('visitsChart');
  const frag = document.createDocumentFragment();

  const barWrap = document.createElement('div');
  barWrap.style.display = 'flex';
  barWrap.style.alignItems = 'flex-end';
  barWrap.style.gap = '8px';
  barWrap.style.height = '100%';
  barWrap.style.padding = '1rem';

  bars.forEach((v) => {
    const b = document.createElement('div');
    b.style.flex = '1';
    b.style.height = `${v}%`;
    b.style.background = 'linear-gradient(180deg,#315efb,#60a5fa)';
    b.style.borderRadius = '6px 6px 0 0';
    b.title = `Value: ${v}`;
    barWrap.appendChild(b);
  });

  frag.appendChild(barWrap);
  chart.appendChild(frag);
})();
