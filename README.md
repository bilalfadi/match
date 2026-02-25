# Football Live – Next.js 14 Football Media Website

Football news aur live match platform – **Next.js 14 (App Router)**, **Tailwind CSS**.  
**MongoDB nahi** – saara data project ke andar **JSON files** mein save hota hai (`data/` folder).

## Features

- **Homepage**: Hero, live matches (30s refresh), News / Football / Premier League sections
- **Category pages**: News, Football, Premier League – pagination
- **Post detail**: Image, author, date, content, share, related posts, ads
- **Match detail**: Team logos, live score, stream iframe, ads
- **Schedule**: Live, upcoming, finished matches
- **Admin**: JWT login; posts, matches, ads manage
- **Ads**: Hero, between sections, post content, above/below iframe, sidebar
- **Legal**: About, Disclaimer, Terms, Privacy, Cookies, CCPA, Contact

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- **File-based storage** – `data/users.json`, `data/posts.json`, `data/matches.json`, `data/ads.json`
- JWT + bcryptjs (admin auth)

## Setup

### 1. Dependencies

```bash
npm install
```

### 2. Environment (optional)

`.env` banao (ya `.env.example` copy karo):

```env
JWT_SECRET=your-secret-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Pehla admin user

Database empty hai to seed se admin banao:

```bash
curl -X POST http://localhost:3000/api/auth/seed -H "Content-Type: application/json" -d "{\"email\":\"admin@example.com\",\"password\":\"yourpassword\"}"
```

Ya `.env` mein `ADMIN_EMAIL` aur `ADMIN_PASSWORD` set karke:

```bash
curl -X POST http://localhost:3000/api/auth/seed
```

Phir `/admin` par login karo.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data kahan save hota hai

- `data/users.json` – admin users
- `data/posts.json` – blog posts (News, Football, Premier League)
- `data/matches.json` – matches (LIVE/UPCOMING/FINISHED)
- `data/ads.json` – ad codes (position-wise)

Sab kuch isi project ke andar save hota hai, koi external database nahi chahiye.

## Admin

- Login: `/admin`
- Dashboard: `/admin/dashboard`
- Posts: `/admin/posts` (add/edit/delete)
- Matches: `/admin/matches` (add/edit, LIVE toggle, stream URL)
- Ads: `/admin/ads`

## Deploy apne server par (production)

Yeh project **apne server / VPS** par chalane ke liye set hai (Vercel use nahi). File storage `data/` folder mein hai – single server par persist rahega.

### 1. Server par setup

```bash
# Dependencies
npm ci

# .env banao (NEXT_PUBLIC_SITE_URL apne domain se set karo)
cp .env.example .env
# .env mein: JWT_SECRET, NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Build (standalone output – chhota deploy)
npm run build
```

### 2. Production run

```bash
# Direct (PORT optional, default 3000)
PORT=3000 node .next/standalone/server.js

# Ya package.json script se
npm run start
```

Agar alag port chahiye (e.g. 3001): `PORT=3001 node .next/standalone/server.js`

### 3. PM2 se daemon (recommended)

```bash
npm install -g pm2
# Standalone build ke baad:
PORT=3000 pm2 start .next/standalone/server.js --name football-live
pm2 save && pm2 startup
```

### 4. Nginx reverse proxy (optional)

Nginx apne server par 80/443 handle kare, app 3000 par chal rahi ho:

```nginx
server {
  listen 80;
  server_name yourdomain.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

HTTPS ke liye Let's Encrypt (certbot) use karo.

### 5. Data aur Puppeteer

- **data/** – posts, matches, users, ads yahi save hote hain. Build/output folder se alag rakho; same project root par `data/` rahega jab `node .next/standalone/server.js` run karte ho (current working directory matter karta hai).
- **Puppeteer (embed extract):** Admin jab “Add match from link” karta hai to kabhi-kabhi headless Chrome chalta hai. Apne server par Chromium install karo:
  - Ubuntu/Debian: `sudo apt install chromium-browser`
  - Agar Puppeteer bundled Chromium use na kare to env mein `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser` set kar sakte ho (zarurat ho to code mein executablePath pass karo).

### 6. Environment (production)

| Variable | Zaroori | Description |
|----------|---------|-------------|
| `JWT_SECRET` | Haan | Strong random string |
| `NEXT_PUBLIC_SITE_URL` | Haan | Full site URL, e.g. `https://yourdomain.com` |
| `PORT` | Optional | Default 3000 |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seed ke liye | Pehla admin banane ke liye |
