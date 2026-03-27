# Serve EduInsight without Nginx

This option keeps your existing React + Vite frontend and Node/Express backend.
Instead of Nginx, a small Python server will:

- serve the built frontend from `dist/`
- proxy `/api/*` requests to the Express backend on `localhost:5001`

## Files added

- `serve_app.py` — static file server + reverse proxy
- `run_app.py` — convenience launcher that installs deps, builds the frontend, starts the backend, and starts the Python server
- `requirements.txt` — no extra packages needed

## Local or EC2 quick start

From the project root:

```bash
python3 run_app.py
```

That will:

1. run `npm install` in the root
2. run `npm install` in `backend/`
3. run `npm run build`
4. start the backend on port `5001`
5. serve the app on port `8000`

Open:

```text
http://YOUR_SERVER_IP:8000
```

## Manual mode

If your backend is already running separately:

```bash
npm run build
python3 serve_app.py
```

By default, the Python server serves on port `8000` and proxies to `http://127.0.0.1:5001`.

## Useful environment variables

```bash
PUBLIC_PORT=8080 BACKEND_PORT=5001 python3 run_app.py
```

Or if the backend is already running elsewhere:

```bash
PORT=8080 BACKEND_URL=http://127.0.0.1:5001 python3 serve_app.py
```

## EC2 security group

Open whichever public port you choose for the Python server.

For the default setup:

- Custom TCP
- Port `8000`
- Source `0.0.0.0/0` for testing

You do not need to expose backend port `5001` publicly when using the Python proxy.

## Notes

- Keep `src/api/client.js` as `baseURL: '/api'`.
- Your backend `.env` should still live in `backend/.env`.
- This is simpler than Nginx for a class project, but Nginx is still the more standard production setup later.
