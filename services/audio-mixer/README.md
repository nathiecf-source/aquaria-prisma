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

1. Autentique no Google Cloud e escolha o projeto:

```bash
gcloud auth login
gcloud config set project SEU_PROJECT_ID
```

2. Habilite as APIs necessárias:

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
```

3. Construa e envie a imagem:

```bash
REGION=southamerica-east1
REPO=aquaria
IMAGE=gcr.io/SEU_PROJECT_ID/aquaria-audio-mixer

gcloud builds submit --tag $IMAGE
```

4. Deploy no Cloud Run:

```bash
gcloud run deploy aquaria-audio-mixer \
  --image $IMAGE \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars AUDIO_MIXER_SECRET=SEU_TOKEN_AQUI \
  --memory 1Gi \
  --timeout 300 \
  --port 8080
```

5. Anote a URL gerada (algo como `https://aquaria-audio-mixer-xxx-uc.a.run.app`).

6. Configure no Vercel:
   - `AUDIO_MIXER_URL` = URL do Cloud Run
   - `AUDIO_MIXER_SECRET` = mesmo token usado no deploy

## Notas

- O container usa a imagem `node:22-slim` e instala o ffmpeg via `apt`.
- Em desenvolvimento local, se você não tem ffmpeg no PATH, o serviço tenta usar os pacotes `ffmpeg-static` e `ffprobe-static` das `devDependencies`.
