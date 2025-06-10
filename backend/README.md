# JammyChat Backend

## Security
- Never commit `.env` or any secrets to GitHub. `.env` is in `.gitignore`.
- All sensitive config (like `MONGODB_URI`) must be set via environment variables.

## Deployment
- Set `MONGODB_URI` and `CLIENT_URL` as environment variables in production (e.g., Render dashboard).
- Use HTTPS in production for secure communication.

## Endpoints
- `/messages` — Get chat history
- `/health` — Health check

## Real-time
- Uses Socket.IO for real-time messaging.
