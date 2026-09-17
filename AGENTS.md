# Regras de Trabalho do Aquar.IA

## Ambientes

O projeto possui dois ambientes no Google Cloud Run:

- **Produção**: `aquaria-app` → `https://aquar-ia.app`
- **Staging**: `aquaria-app-staging` → URL temporária fornecida pelo Cloud Run

## Protocolo de Deploy

1. Toda nova API ou mudança estrutural deve ser testada e validada em staging antes de produção.
2. O deploy padrão vai para staging:
   ```powershell
   .\deploy.ps1 -Environment staging
   ```
3. Só após validação em staging, faça deploy em produção:
   ```powershell
   .\deploy.ps1 -Environment production
   ```
   Será solicitado digitar `producao` para confirmar.
4. Antes de qualquer deploy, rode:
   ```powershell
   npm run lint
   npm test
   npm run build
   ```

## Variáveis de Ambiente

- **Nunca use `--set-env-vars`** no deploy. Sempre use `--update-env-vars` ou `--env-vars-file`.
- O deploy padrão (`cloudbuild-staging.yaml` / `cloudbuild-production.yaml`) não altera variáveis de ambiente. Apenas recompila e atualiza a imagem.
- Para sincronizar envs do staging com a produção:
  ```powershell
  .\set-env-staging.ps1
  ```
- Para atualizar a produção (com cuidado):
  ```powershell
  .\set-env-production.ps1
  ```

## Notificações no Staging

O staging nasce com `ONESIGNAL_REST_API_KEY` e `CRON_SECRET` vazios, então não envia notificações para usuários reais. Para testar push no staging, configure um app de teste separado no OneSignal e atualize apenas o staging com as chaves de teste.

## Proteção contra Apagão de Env

- Backup das envs antes de alterações:
  ```powershell
  gcloud run services describe aquaria-app --region us-central1 --format yaml > envs-backup.yaml
  ```
- Verificação após deploy:
  ```powershell
  gcloud run services describe aquaria-app --region us-central1 --format "value(spec.template.spec.containers.env.name)"
  ```

## Credenciais

- Nunca cole secrets no chat.
- Não commite arquivos `.env*`, `.env.deploy.run.yaml` ou similares.
- Arquivos sensíveis devem estar listados em `.gitignore` e `.gcloudignore`.

## Domínio

- O domínio canônico é `https://aquar-ia.app`.
- `www.aquar-ia.app` redireciona para a raiz via Cloudflare.
