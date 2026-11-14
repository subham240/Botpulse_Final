# BotPulse

## Deploy the frontend to Vercel

Import this repository into Vercel. The project uses Vite; use `npm run build` as
the build command and `dist` as the output directory.

Set `VITE_API_URL` in the Vercel project environment to the HTTPS base URL of a
deployed BotPulse API, including `/api/v1`. The FastAPI backend is not hosted by
this static Vite deployment and must be deployed separately. Without this
setting, the frontend uses the local development API URL.

## Backend configuration

Set `BOTPULSE_SECRET_KEY` in the backend host's environment to a unique random
value of at least 32 characters. For local development, copy `.env.example` to
`.env` and replace the example key; do not commit `.env`.

Generate a key with:

```sh
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
