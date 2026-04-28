# Redis Setup Guide

The Zosterix platform requires Redis for features like rate limiting, session revocation (token blocklist), and background cleanup.

## Option 1: Docker (Recommended)

If you have Docker Desktop installed, you can start Redis (and PostgreSQL) using the provided `docker-compose.yml` file.

1. Open a terminal in the root directory.
2. Run:
   ```bash
   docker compose up -d
   ```
This will start Redis on port `6379` and PostgreSQL on port `5432`.

## Option 2: Native Installation (Windows)

If you prefer not to use Docker, you can install Redis natively or via WSL.

### Via WSL (Recommended for Windows)
1. Install WSL if you haven't already: `wsl --install`
2. Open your WSL terminal (e.g., Ubuntu).
3. Install Redis:
   ```bash
   sudo apt update
   sudo apt install redis-server
   ```
4. Start Redis:
   ```bash
   sudo service redis-server start
   ```

### Via Native Windows Port (Legacy)
You can download the `.msi` or `.zip` from the [Memurai](https://www.memurai.com/) (Redis compatible for Windows) or the legacy [Microsoft Archive](https://github.com/microsoftarchive/redis/releases). 

> [!WARNING]
> The Microsoft Archive version is very old (v3.0). It is highly recommended to use Docker or WSL.

## Troubleshooting

### "Connection Refused"
If you see `dial tcp [::1]:6379: connectex: No connection could be made...`, it usually means:
- Redis is not running.
- Redis is only listening on `127.0.0.1` and your system is trying to connect via `::1` (IPv6).

To fix the IPv6 issue, you can change your `REDIS_URL` in `.env` from `localhost` to `127.0.0.1`:
```env
REDIS_URL=redis://127.0.0.1:6379/0
```

### Degraded Functionality
The backend is configured to detect if Redis is down. If it cannot connect, it will log a warning and continue. However:
- Rate limiting will NOT be enforced.
- Revoked tokens (from logouts) might still be usable until they naturally expire.
- Some background cleanup tasks may fail.
