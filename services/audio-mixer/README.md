# Aquar.IA Audio Mixer

Microserviço externo responsável por mixar a narração das meditações com a trilha sonora de fundo, usando ffmpeg.

Esse serviço é executado no Google Cloud Run (ou outro ambiente containerizado), fora da função serverless da Vercel, evitando o peso dos binários do ffmpeg no bundle.

## Endpoint

### `POST /mix`

Faz o mix de uma narração com uma trilha sonora.

**Headers opcionais:**

- `x-mixer-secret` — se `AUDIO_MIXER_SECRET` estiver configurado, é obrigatório.

**Body (JSON):**

```json
{
  "narrationUrl": "https://exemplo.com/narracao.mp3",
  "backgroundUrl": "https://exemplo.com/background-meditation.mp3",
  "options": {
    "backgroundVolume": 0.28,
    "fadeInSeconds": 3,
    "fadeOutSeconds": 4
  }
}
```

**Response:** arquivo MP3 (`audio/mpeg`).

### `GET /health`

Retorna `{ "status": "ok" }`.

## Variáveis de ambiente

| Nome | Descrição | Obrigatório |
|------|-----------|-------------|
| `PORT` | Porta do servidor (padrão: 8080) | Não |
| `AUDIO_MIXER_SECRET` | Token compartilhado com o backend Vercel | Não, mas recomendado |

## Desenvolvimento local

```bash
cd services/audio-mixer
npm install
npm run dev
```

## Deploy no Google Cloud Run

### Pré-requisitos

- `gcloud` CLI instalado e autenticado (`gcloud auth login` ou service account).
- Projeto `aquaria-audio` selecionado: `gcloud config set project aquaria-audio`.
- APIs habilitadas:

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
```

### Gerar o secret

Crie um arquivo `.env` em `services/audio-mixer/.env` com:

```dotenv
AUDIO_MIXER_SECRET=seu_token_aqui
```

Ou use o `.env` já gerado no projeto.

### Usando o script de deploy (recomendado)

No Windows (PowerShell):

```powershell
cd services/audio-mixer
.\deploy.ps1
```

No Linux/macOS/WSL:

```bash
cd services/audio-mixer
chmod +x deploy.sh
./deploy.sh
```

Os scripts executam `gcloud builds submit` e `gcloud run deploy` automaticamente.

### Deploy manual

```bash
cd services/audio-mixer

IMAGE=gcr.io/aquaria-audio/aquaria-audio-mixer

gcloud builds submit --tag $IMAGE

gcloud run deploy aquaria-audio-mixer \
  --image $IMAGE \
  --region southamerica-east1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars AUDIO_MIXER_SECRET=SEU_TOKEN_AQUI \
  --memory 1Gi \
  --timeout 300 \
  --port 8080
```

### Configurar no Vercel

1. Anote a URL gerada (algo como `https://aquaria-audio-mixer-xxx-rsa.a.run.app`).
2. No painel da Vercel, adicione as variáveis de ambiente:
   - `AUDIO_MIXER_URL` = URL do Cloud Run
   - `AUDIO_MIXER_SECRET` = mesmo token usado no deploy
3. Re-deploy a aplicação na Vercel.

## Notas

- O container usa a imagem `node:22-slim` e instala o ffmpeg via `apt`.
- Em desenvolvimento local, se você não tem ffmpeg no PATH, o serviço tenta usar os pacotes `ffmpeg-static` e `ffprobe-static` das `devDependencies`.
