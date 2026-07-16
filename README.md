# Noryn Agro MVP

MVP local para testar uma plataforma vendável de pecuária leiteira de precisão.

A versão atual simula um **centro de comando da fazenda**, com:

- dashboard executivo de produção, conforto térmico, solo, chuva e vento;
- mapa visual de piquetes com umidade, status, área, histórico e recomendação de manejo;
- animações dinâmicas de chuva, vento, nuvens, sol e direção do vento;
- ranking das melhores vacas produtoras;
- controle visual de estoque para ração, medicamentos, higiene, volumoso e insumos;
- área de upload visual de documentos da fazenda;
- calendário operacional para CCS/CBT, IATF, vacinação, adubação, compras e manutenção;
- API HTTP pronta para receber pacotes de sensores LoRa/Raspberry.

A ideia é começar com dados simulados e lançamento manual, validar a experiência do produto e depois conectar sensores reais.

## Como rodar

Requisitos:

- Node.js 18 ou superior.

```bash
npm start
```

Acesse:

```text
http://localhost:3000
```

Não há dependências externas neste MVP. Os dados ficam em `data/readings.json`, criado automaticamente na primeira execução.

## Endpoints principais

### Saúde da aplicação

```http
GET /api/health
```

### Resumo do painel

```http
GET /api/summary
```

### Últimas leituras

```http
GET /api/readings?limit=30
```

### Enviar leitura

```http
POST /api/readings
Content-Type: application/json
```

Exemplo para estação meteorológica:

```json
{
  "type": "weather",
  "source": "estacao-principal",
  "temperatureC": 31.8,
  "humidityPct": 58,
  "rainMm": 4.8,
  "windKmh": 12,
  "windDirectionDeg": 45,
  "batteryPct": 92
}
```

Exemplo para piquete:

```json
{
  "type": "soil",
  "source": "P-04",
  "soilMoisturePct": 18,
  "soilTemperatureC": 27.4,
  "depthCm": 20,
  "irrigationMinutes": 0,
  "batteryPct": 79
}
```

Exemplo para produção de leite:

```json
{
  "type": "milk",
  "source": "tanque",
  "milkLiters": 1018,
  "lactatingCows": 60,
  "notes": "Tanque da manhã"
}
```

## Próximos passos técnicos

1. Persistir documentos de verdade em disco ou S3 compatível.
2. Criar cadastro real de vacas, lotes, piquetes e fornecedores.
3. Transformar estoque e calendário em endpoints persistidos.
4. Adicionar autenticação por propriedade.
5. Criar receptor LoRa no Raspberry Pi publicando leituras em `/api/readings`.
6. Separar frontend em React/Vite quando o protótipo visual estiver aprovado.
