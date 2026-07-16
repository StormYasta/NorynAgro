# Noryn Agro MVP

MVP local para testar uma plataforma de gestão agropecuária com foco em pecuária leiteira de precisão.

A primeira versão cruza quatro grupos de dados:

- produção diária de leite;
- conforto térmico das vacas, com cálculo automático de THI;
- clima local, chuva e vento;
- umidade do solo e irrigação por piquete.

A ideia é começar simples, com lançamento manual e API HTTP, e depois conectar o receptor LoRa/Raspberry Pi para receber os dados das unidades remotas.

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
GET /api/readings
GET /api/readings?type=milk
GET /api/readings?type=soil
GET /api/readings?type=comfort
```

### Criar leitura

```http
POST /api/readings
Content-Type: application/json
```

Exemplo de produção de leite:

```json
{
  "type": "milk",
  "source": "tanque",
  "milkLiters": 1000,
  "lactatingCows": 60,
  "notes": "Registro diário do tanque"
}
```

Exemplo de conforto térmico:

```json
{
  "type": "comfort",
  "source": "curral-espera",
  "temperatureC": 33.1,
  "humidityPct": 64,
  "notes": "Leitura próxima da ordenha da tarde"
}
```

Exemplo de solo/piquete:

```json
{
  "type": "soil",
  "source": "piquete-03",
  "soilMoisturePct": 24,
  "soilTemperatureC": 25.5,
  "depthCm": 20,
  "irrigationMinutes": 0
}
```

## Estrutura

```text
src/server.js       API HTTP, armazenamento JSON e cálculo de indicadores
public/index.html   Dashboard
public/styles.css   Interface
public/app.js       Consumo da API e formulários
data/readings.json  Base local criada em runtime
```

## Próximos passos

1. Conectar o gateway LoRa na Raspberry Pi.
2. Criar identificação das unidades remotas por `source`.
3. Registrar produção individual por vaca.
4. Adicionar cadastro de lotes, piquetes e animais.
5. Calcular necessidade de irrigação por evapotranspiração e umidade do solo.
6. Criar alertas por WhatsApp/Telegram.
7. Sincronizar dados locais com uma API em nuvem.

## Payload pensado para sensores LoRa

O gateway LoRa pode transformar a mensagem recebida em um POST para `/api/readings`.

```json
{
  "type": "weather",
  "source": "estacao-principal",
  "temperatureC": 31.8,
  "humidityPct": 58,
  "rainMm": 0,
  "windKmh": 8,
  "batteryPct": 86
}
```