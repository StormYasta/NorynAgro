const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'readings.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedReadings(new Date()), null, 2));
  }
}

function seedReadings(now) {
  const daysAgo = (days, hour = 9) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  return [
    { timestamp: daysAgo(6), source: 'manual', type: 'milk', milkLiters: 980, lactatingCows: 60, notes: 'Dado de exemplo: tanque diário.' },
    { timestamp: daysAgo(5), source: 'manual', type: 'milk', milkLiters: 1015, lactatingCows: 60, notes: 'Dado de exemplo: tanque diário.' },
    { timestamp: daysAgo(4), source: 'manual', type: 'milk', milkLiters: 1002, lactatingCows: 60, notes: 'Dado de exemplo: tanque diário.' },
    { timestamp: daysAgo(3), source: 'manual', type: 'milk', milkLiters: 1030, lactatingCows: 60, notes: 'Dado de exemplo: tanque diário.' },
    { timestamp: daysAgo(2), source: 'manual', type: 'milk', milkLiters: 995, lactatingCows: 60, notes: 'Dado de exemplo: tanque diário.' },
    { timestamp: daysAgo(1), source: 'manual', type: 'milk', milkLiters: 1000, lactatingCows: 60, notes: 'Dado de exemplo: tanque diário.' },
    { timestamp: daysAgo(0, 13), source: 'estacao-principal', type: 'weather', temperatureC: 31.8, humidityPct: 58, rainMm: 0, windKmh: 8, notes: 'Dado de exemplo: clima externo.' },
    { timestamp: daysAgo(0, 14), source: 'curral-espera', type: 'comfort', temperatureC: 33.1, humidityPct: 64, notes: 'Dado de exemplo: conforto térmico.' },
    { timestamp: daysAgo(0, 8), source: 'piquete-03', type: 'soil', soilMoisturePct: 24, soilTemperatureC: 25.5, depthCm: 20, irrigationMinutes: 0, notes: 'Dado de exemplo: umidade superficial.' },
  ].map(normalizeReading);
}

function readAll() {
  ensureStorage();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeAll(readings) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(readings, null, 2));
}

function normalizeReading(input) {
  const reading = {
    id: input.id || crypto.randomUUID(),
    timestamp: input.timestamp || new Date().toISOString(),
    source: String(input.source || 'manual'),
    type: String(input.type || 'general'),
    notes: input.notes ? String(input.notes) : '',
  };

  const numericFields = [
    'milkLiters', 'lactatingCows', 'temperatureC', 'humidityPct', 'rainMm',
    'windKmh', 'soilMoisturePct', 'soilTemperatureC', 'depthCm',
    'irrigationMinutes', 'batteryPct', 'flowLiters',
  ];

  for (const field of numericFields) {
    if (input[field] !== undefined && input[field] !== null && input[field] !== '') {
      const value = Number(input[field]);
      if (!Number.isNaN(value)) reading[field] = value;
    }
  }

  if (reading.temperatureC !== undefined && reading.humidityPct !== undefined) {
    reading.thi = Number(calculateTHI(reading.temperatureC, reading.humidityPct).toFixed(1));
    reading.thermalStatus = getThermalStatus(reading.thi);
  }

  return reading;
}

function calculateTHI(temperatureC, humidityPct) {
  const temperatureF = temperatureC * 1.8 + 32;
  return temperatureF - (0.55 - 0.0055 * humidityPct) * (temperatureF - 58);
}

function getThermalStatus(thi) {
  if (thi >= 84) return 'emergencia';
  if (thi >= 78) return 'alto';
  if (thi >= 72) return 'moderado';
  if (thi >= 68) return 'atencao';
  return 'normal';
}

function getSummary(readings) {
  const sorted = [...readings].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const latestByType = {};
  for (const reading of sorted) {
    if (!latestByType[reading.type]) latestByType[reading.type] = reading;
  }

  const milkReadings = sorted.filter((reading) => reading.type === 'milk' && Number.isFinite(reading.milkLiters));
  const comfortReadings = sorted.filter((reading) => Number.isFinite(reading.thi));
  const soilReadings = sorted.filter((reading) => reading.type === 'soil' && Number.isFinite(reading.soilMoisturePct));
  const lastMilk = milkReadings[0] || null;
  const milk7d = milkReadings.slice(0, 7);
  const avgMilk7d = average(milk7d.map((reading) => reading.milkLiters));
  const avgLitersPerCow7d = average(milk7d.filter((reading) => reading.lactatingCows > 0).map((reading) => reading.milkLiters / reading.lactatingCows));
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const rain24h = readings.filter((reading) => new Date(reading.timestamp).getTime() >= twentyFourHoursAgo).reduce((total, reading) => total + (reading.rainMm || 0), 0);
  const maxThi24h = Math.max(...comfortReadings.filter((reading) => new Date(reading.timestamp).getTime() >= twentyFourHoursAgo).map((reading) => reading.thi), 0);

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      readings: readings.length,
      rain24h: Number(rain24h.toFixed(1)),
      maxThi24h: Number(maxThi24h.toFixed(1)),
      avgMilk7d: roundOrNull(avgMilk7d),
      avgLitersPerCow7d: roundOrNull(avgLitersPerCow7d),
      lastMilkLiters: lastMilk?.milkLiters ?? null,
      lastLactatingCows: lastMilk?.lactatingCows ?? null,
    },
    latestByType,
    alerts: buildAlerts({ lastMilk, avgMilk7d, avgLitersPerCow7d, maxThi24h, soilReadings, rain24h }),
  };
}

function buildAlerts({ lastMilk, avgMilk7d, avgLitersPerCow7d, maxThi24h, soilReadings, rain24h }) {
  const alerts = [];
  if (maxThi24h >= 78) alerts.push({ severity: 'high', title: 'Estresse térmico alto', message: `THI máximo em 24h: ${maxThi24h.toFixed(1)}. Revisar sombra, ventilação e aspersão.` });
  else if (maxThi24h >= 72) alerts.push({ severity: 'medium', title: 'Atenção ao conforto térmico', message: `THI máximo em 24h: ${maxThi24h.toFixed(1)}.` });

  const latestSoil = soilReadings[0];
  if (latestSoil && latestSoil.soilMoisturePct < 22) alerts.push({ severity: 'medium', title: 'Solo secando', message: `${latestSoil.source}: ${latestSoil.soilMoisturePct}% de umidade. Avaliar irrigação.` });
  if (lastMilk && avgMilk7d && lastMilk.milkLiters < avgMilk7d * 0.95) alerts.push({ severity: 'medium', title: 'Queda de produção', message: `Último tanque ${lastMilk.milkLiters} L, abaixo da média de 7 dias.` });
  if (avgLitersPerCow7d && avgLitersPerCow7d < 18) alerts.push({ severity: 'info', title: 'Meta produtiva inicial', message: `Média atual de ${avgLitersPerCow7d.toFixed(1)} L/vaca/dia. Meta sugerida: 19–20 L.` });
  if (rain24h === 0) alerts.push({ severity: 'info', title: 'Sem chuva registrada', message: 'Sem chuva nas últimas 24h. Cruze com umidade do solo antes de irrigar.' });
  return alerts;
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return null;
  return valid.reduce((total, value) => total + value, 0) / valid.length;
}

function roundOrNull(value, decimals = 1) {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(decimals));
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error('Payload muito grande.'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  const requestedPath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!requestedPath.startsWith(PUBLIC_DIR)) return void res.writeHead(403).end('Forbidden');

  fs.readFile(requestedPath, (error, content) => {
    if (error) return void res.writeHead(404).end('Not found');
    const ext = path.extname(requestedPath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'GET' && url.pathname === '/api/health') return sendJson(res, 200, { status: 'ok', app: 'Noryn Agro MVP' });
  if (req.method === 'GET' && url.pathname === '/api/readings') {
    const type = url.searchParams.get('type');
    const limit = Number(url.searchParams.get('limit') || 100);
    const readings = readAll().filter((reading) => !type || reading.type === type).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, Number.isFinite(limit) ? limit : 100);
    return sendJson(res, 200, readings);
  }
  if (req.method === 'GET' && url.pathname === '/api/summary') return sendJson(res, 200, getSummary(readAll()));
  if (req.method === 'POST' && url.pathname === '/api/readings') {
    try {
      const payload = JSON.parse(await readRequestBody(req));
      const readings = readAll();
      const reading = normalizeReading(payload);
      readings.push(reading);
      writeAll(readings);
      return sendJson(res, 201, reading);
    } catch (error) {
      return sendJson(res, 400, { error: error.message || 'Payload inválido.' });
    }
  }
  if (req.method === 'DELETE' && url.pathname === '/api/readings') {
    writeAll([]);
    return sendJson(res, 200, { deleted: true });
  }
  return sendJson(res, 404, { error: 'Rota não encontrada.' });
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/')) return handleApi(req, res);
  return serveStatic(req, res);
});

ensureStorage();
server.listen(PORT, () => console.log(`Noryn Agro MVP rodando em http://localhost:${PORT}`));
