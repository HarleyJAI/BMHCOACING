const lastUpdated = document.getElementById('lastUpdated');
const now = new Date();
lastUpdated.textContent = `Updated: ${now.toLocaleString()}`;

const form = document.getElementById('clientIntakeForm');
const tbody = document.querySelector('#intakeTable tbody');
const exportBtn = document.getElementById('exportQueueBtn');
const queue = [];

function renderQueue() {
  tbody.innerHTML = '';
  queue.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.contact}</td>
      <td><span class="tag ${item.urgency >= 4 ? 'critical' : item.urgency >= 3 ? 'high' : 'medium'}">${item.urgency}</span></td>
      <td>${item.needs}</td>
      <td>${item.addedAt}</td>
    `;
    tbody.appendChild(tr);
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const item = {
    name: document.getElementById('clientName').value.trim(),
    contact: document.getElementById('clientContact').value.trim(),
    urgency: Number(document.getElementById('clientUrgency').value),
    needs: document.getElementById('clientNeeds').value.trim() || '-',
    addedAt: new Date().toLocaleTimeString(),
  };
  queue.push(item);
  renderQueue();
  form.reset();
});

exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(queue, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'session-client-queue.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
