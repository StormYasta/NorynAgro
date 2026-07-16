const summaryCards = document.querySelector('#summaryCards');
const alertsEl = document.querySelector('#alerts');
const readingsTable = document.querySelector('#readingsTable');
const refreshButton = document.querySelector('#refreshButton');
const milkForm = document.querySelector('#milkForm');
const sensorForm = document.querySelector('#sensorForm');

async function api(path, options) {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || 'Erro na API');
  }
  return response.json();
}

function formatNumber(value, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}${suffix}`;
}

function formatDate(value) {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function renderCards(summary) {
  const { totals } = summary;
  const cards = [
    { label: 'Último tanque', value: formatNumber(totals.lastMilkLiters, ' L'), detail: `${totals.lastLactatingCows || '—'} vacas em lactação` },
    { label: 'Média 7 dias', value: formatNumber(totals.avgMilk7d, ' L'), detail: 'produção diária' },
    { label: 'Litros/vaca', value: formatNumber(totals.avgLitersPerCow7d, ' L'), detail: 'média dos últimos registros' },
    { label: 'THI máx. 24h', value: formatNumber(totals.maxThi24h), detail: `chuva 24h: ${formatNumber(totals.rain24h, ' mm')}` },
  ];
  summaryCards.innerHTML = cards.map((card) => `<article class="card"><span>${card.label}</span><strong>${card.value}</strong><small>${card.detail}</small></article>`).join('');
}

function renderAlerts(alerts) {
  if (!alerts.length) {
    alertsEl.innerHTML = '<div class="alert"><strong>Nenhum alerta ativo</strong><p>Os dados atuais não indicam ação urgente.</p></div>';
    return;
  }
  alertsEl.innerHTML = alerts.map((alert) => `<div class="alert ${alert.severity}"><strong>${alert.title}</strong><p>${alert.message}</p></div>`).join('');
}

function renderReadings(readings) {
  readingsTable.innerHTML = readings.map((reading) => `
    <tr>
      <td>${formatDate(reading.timestamp)}</td>
      <td><strong>${reading.type}</strong></td>
      <td>${reading.source}</td>
      <td>${reading.milkLiters ? `${formatNumber(reading.milkLiters, ' L')}` : '—'}</td>
      <td>${reading.thi ? `${formatNumber(reading.thi)} (${reading.thermalStatus})` : '—'}</td>
      <td>${reading.soilMoisturePct ? formatNumber(reading.soilMoisturePct, '%') : '—'}</td>
      <td>${reading.rainMm !== undefined ? formatNumber(reading.rainMm, ' mm') : '—'}</td>
    </tr>
  `).join('');
}

async function loadDashboard() {
  const [summary, readings] = await Promise.all([api('/api/summary'), api('/api/readings?limit=20')]);
  renderCards(summary);
  renderAlerts(summary.alerts);
  renderReadings(readings);
}

function formToPayload(form) {
  return Object.fromEntries([...new FormData(form).entries()].filter(([, value]) => value !== ''));
}

milkForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = { ...formToPayload(milkForm), type: 'milk', source: 'tanque' };
  await api('/api/readings', { method: 'POST', body: JSON.stringify(payload) });
  milkForm.reset();
  await loadDashboard();
});

sensorForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await api('/api/readings', { method: 'POST', body: JSON.stringify(formToPayload(sensorForm)) });
  sensorForm.reset();
  await loadDashboard();
});

refreshButton.addEventListener('click', loadDashboard);

loadDashboard().catch((error) => {
  document.body.innerHTML = `<main class="panel"><h1>Erro ao carregar</h1><p>${error.message}</p></main>`;
});
