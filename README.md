# Catcheroo

A small webhook listener that receives JSON events over HTTP POST and shows them live on a web page. It runs on my VPS at https://catcheroo.com/listener.

It is the receiving end for [ATM-osphere](https://github.com/alex2t/bankingApp), my Android test banking app. The app posts an event for each of three activities: `Login`, `AddPayee` and `Transaction`. Each payload carries the session ID, permanent user ID (PUID), user agent and public IP, plus the payee data or the payment details (payee IBAN, country, amount, transaction type).

## Background

I built Catcheroo alongside the mobile app to test a solution at work: the app produces the events, and Catcheroo lets me see exactly what was sent, in real time.

## Test tool, not production

This is a personal test tool used only by me. The listener has no authentication on purpose: anyone who can reach the URL can post, view and delete events. Do not send real customer data to it.

## How it works

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/listener` | Receive an event (JSON body). Returns `200 {"message": "Event received"}`. |
| `GET` | `/listener` | Return the events page, or a JSON array if the request has `Accept: application/json`. |
| `DELETE` | `/listener/:id` | Delete one event. Returns `404` if it no longer exists. |

1. **Receive.** `POST /listener` reads the `activity` field from the body (`Unknown` if missing). All other fields are kept as-is, so the listener does not depend on the payload shape.
2. **Store.** The event is saved in Redis under the key `event:<timestamp in ms>` with a TTL of 300 seconds (`EVENT_TTL` in `routes/eventlistener.js`). Redis removes it after 5 minutes; nothing else is persisted.
3. **Broadcast.** The new event is pushed to every connected browser over a WebSocket (same host and port as the app; the server pings clients every 30 seconds to keep the connection alive).
4. **Display.** The page shows a table with the activity and receive time, the pretty-printed payload, and a response column (always `Success`). New events are added to the top as they arrive. Each row has a Delete button.

Expiry note: an open page does not remove rows by itself. An expired event disappears the next time the table is loaded (page reload, or after deleting a row, which refetches the list).

## Tech stack

- Node.js, Express 4, EJS with `express-ejs-layouts`, Bootstrap 5 (CDN)
- Redis (`redis` v4 client) for event storage with TTL
- `ws` for the WebSocket server
- Nginx as HTTPS reverse proxy (Let's Encrypt certificate) on a CloudPanel VPS

The repo also contains an unfinished registration and login flow (`routes/registration/`, SQLite, bcrypt, JWT email links via Nodemailer). It is local test code only and is not deployed on the VPS. It is not wired to the listener: the `/listener` routes are not protected and login does not create a session.

## Run locally

Requirements: Node.js and a Redis server on `localhost:6379` (the client uses the default connection).

```bash
npm install
node app.js
```

The app listens on port `3001`; open http://localhost:3001/listener. There is no `npm start` script.

A `.env` file is required because `db.js` opens the SQLite database at startup:

```
DB_PATH=./users.db
DB_TABLE_Auth=users
SECRET_KEY=...
EMAIL_USER=...
EMAIL_PASS=...
EMAIL_DOMAIN=...
```

Only `DB_PATH` and `DB_TABLE_Auth` are needed for the listener itself; the others are used by the registration flow. `SECRET_KEY` has no default and must be set for the registration flow to work.

Send a test event:

```bash
curl -X POST http://localhost:3001/listener \
  -H "Content-Type: application/json" \
  -d '{"activity": "Login", "sessionId": "abc123", "puid": "u-001"}'
```

## Deploy

Only the listener runs on the VPS. Node serves the app on `127.0.0.1:3001` and Nginx terminates HTTPS for `catcheroo.com`, redirects HTTP to HTTPS, and proxies requests (including WebSocket upgrades) to the app. The Nginx configuration, process manager setup and deploy steps are not part of the repo.

## Timeline

Started on 2024-12-16 (first commit).

| Date | Milestone |
|------|-----------|
| 2024-12-16 | First version: simple Express event listener |
| 2024-12-25 | MVC structure, WebSocket live updates, Redis storage |
| 2025-01-17 | Fixed live display, added timestamps |
| 2025-01-19 | Delete button, table rendering refactor, port and host configuration |
| 2025-01-21 | WebSocket keep-alive ping |
| 2025-02-09 to 2025-02-15 | Started registration flow (SQLite, password rules, reset by email), route reorganisation, groundwork for JWT authentication (unfinished) |
