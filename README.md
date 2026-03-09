# Birthdays

The kids in your life keep getting older. You keep forgetting how old they are. This helps.

A birthday tracker that shows upcoming birthdays sorted by how soon they are, with ages and countdowns.

**Two ways to use it:**

- **GitHub Pages** — runs entirely in your browser with no server needed. Data lives in localStorage. [Try it here.](https://selesse.github.io/birthdays/)
- **Self-hosted** — Bun server + SQLite, good for a shared dashboard running on a home server or VPS.

---

## Self-hosted setup

**Requirements:** [Bun](https://bun.sh)

```bash
bun install
bun run dev        # http://localhost:3000
```

### Deploying

Copy `.env.example` to `.env` and fill it in:

```bash
# .env
DEPLOY_HOST=user@your-server.example.com
DEPLOY_PATH=/home/user/git/birthdays
PORT=3000
```

Then deploy:

```bash
script/deploy
```

This rsyncs the project, installs dependencies, and restarts the systemd user service on the remote host. The service file (`birthday-tracker.service`) is installed automatically on first deploy.
