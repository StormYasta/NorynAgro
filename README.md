# Noryn Agro MVP

MVP local para testar uma plataforma vendável de pecuária leiteira de precisão.

A versão atual foi reorganizada para um público menos técnico, com **tema claro**, navegação simples e páginas separadas:

- **Painel geral**: visão executiva de produção, clima, alertas, ranking e últimas leituras.
- **Piquetes**: mapa visual da fazenda, piquete ativo, umidade do solo, histórico e recomendação de irrigação.
- **Estoque**: controle detalhado de ração, volumoso, medicamentos, higiene e insumos, com autonomia em dias, validade, fornecedor, consumo médio e sugestão de compra.
- **Planejamento**: calendário operacional para manejos, IATF, qualidade do leite, manutenção, compras e adubação.
- **Documentos**: central para simular upload e organização de notas fiscais, análises de solo, receitas, contratos e relatórios.

A ideia continua sendo começar com dados simulados e lançamento manual, validar a experiência do produto e depois conectar sensores reais via LoRa/Raspberry Pi.

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

## Páginas

```text
/                Painel geral
/paddocks.html   Piquetes e irrigação
/inventory.html  Controle de estoque
/planning.html   Planejamento
/documents.html  Documentos
```

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

## Próximo passo técnico

Os módulos de estoque, documentos, planejamento, ranking e piquetes ainda usam dados de demonstração no frontend. O próximo passo é transformar essas áreas em entidades persistidas na API, com endpoints próprios e banco de dados simples.