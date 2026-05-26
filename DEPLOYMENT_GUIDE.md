# 🚀 Ghid Deploy Figuroo pe Hosting Free

Acest ghid te ajută să deploiezi Figuroo pe platforme free: **Vercel** (frontend) + **Render/Railway** (backend) + **Supabase** (baza de date).

---

## 📋 Cerințe Prealabile

- Cont GitHub (pentru versioning și deploy)
- Cont Vercel (free)
- Cont Render sau Railway (free)
- Cont Supabase (free)
- Node.js 18+ instalat local

---

## 1️⃣ Setup Baza de Date (Supabase - Free)

### Pasul 1: Creează cont Supabase
1. Du-te la [supabase.com](https://supabase.com)
2. Dă click pe "Sign Up" și creează cont cu GitHub
3. Creează un nou project cu aceste setări:
   - **Database Password**: Salvează într-un loc sigur! 🔐
   - **Region**: Europe (Virginia) - cel mai aproape de România
   - **Pricing Plan**: Free

### Pasul 2: Creează tabelele

După ce projectul e creat:

1. **Mergi la SQL Editor** → Copiază și execută SQL-ul:

```sql
-- Admin Tokens Table
CREATE TABLE admin_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  usage_count BIGINT DEFAULT 0
);

-- Products Table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  filament_used_grams NUMERIC(10, 2),
  default_price NUMERIC(10, 2),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_color TEXT,
  material TEXT,
  order_price NUMERIC(10, 2),
  shipping_price NUMERIC(10, 2),
  filament_cost NUMERIC(10, 2),
  courier TEXT,
  awb_code TEXT,
  easybox_qr_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  deadline TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Inventory Table
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  filament_name TEXT NOT NULL,
  color TEXT,
  grams_left NUMERIC(10, 2) NOT NULL,
  low_stock_threshold NUMERIC(10, 2) DEFAULT 500,
  cost_per_kg NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Genereaza un token admin default
INSERT INTO admin_tokens (token, name, is_active)
VALUES ('figuroo_admin_default_change_me', 'Default Token - Schimbă-l!', true);
```

### Pasul 3: Obține credențialele

1. Du-te la **Settings** → **Database**
2. Copie **Connection String** (URI postgres):
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   ```

---

## 2️⃣ Deploy Backend (Render - Free)

### Pasul 1: Pregătire Backend Local

1. Deschide terminal în folder-ul backend:
   ```bash
   cd /workspaces/figuroo/artifacts/api-server
   ```

2. Verifica `package.json` are corect setup-ul

### Pasul 2: Push pe GitHub

```bash
cd /workspaces/figuroo
git add -A
git commit -m "Ready for deployment"
git push origin main
```

### Pasul 3: Creează cont Render

1. Du-te la [render.com](https://render.com)
2. Sign up cu GitHub
3. Authorize Render să acceseze repo-urile tale

### Pasul 4: Deploy Backend pe Render

1. **Dashboard Render** → **+ New Service**
2. Selectează **Web Service**
3. Conectează repo GitHub `figuroo`
4. Setări:
   - **Name**: `figuroo-api`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build` (dacă are build script) sau lasă gol
   - **Start Command**: `node artifacts/api-server/build/index.js` (ajustează după structure)
   - **Plan**: Free

5. **Environment Variables** - Adaugă:
   ```
   NODE_ENV=production
   SUPABASE_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   PORT=10000
   ```

6. Deploy! ✅ Render va genera URL: `https://figuroo-api.onrender.com`

---

## 3️⃣ Deploy Frontend (Vercel - Free)

### Pasul 1: Configurare Environment

1. Mergi în folder frontend:
   ```bash
   cd /workspaces/figuroo/artifacts/figuroo
   ```

2. Crea `.env.production`:
   ```
   VITE_API_URL=https://figuroo-api.onrender.com
   ```

### Pasul 2: Deploy pe Vercel

1. Du-te la [vercel.com](https://vercel.com)
2. Sign up cu GitHub
3. **Add New Project**
4. Importă repo `figuroo`
5. Setări:
   - **Project Name**: `figuroo`
   - **Framework**: Vite
   - **Root Directory**: `artifacts/figuroo`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. **Environment Variables**:
   ```
   VITE_API_URL=https://figuroo-api.onrender.com
   VITE_BASE_URL=/
   ```

7. Deploy! ✅ Vercel va genera URL: `https://figuroo.vercel.app`

---

## 4️⃣ Configurare API Backend

### Pasul 1: Asigură-te că backend suportă CORS

File: `artifacts/api-server/src/app.ts`

```typescript
app.use(cors({
  origin: ["https://figuroo.vercel.app", "http://localhost:5173"],
  credentials: true
}));
```

### Pasul 2: Update Frontend API URL

File: `artifacts/figuroo/src/pages/login.tsx`

Schimbă:
```typescript
const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify`, {
```

---

## 5️⃣ Primul Login & Setup Admin

### Pasul 1: Obține Token

1. Mergi pe Supabase → SQL Editor
2. Execută:
   ```sql
   SELECT token FROM admin_tokens WHERE name = 'Default Token - Schimbă-l!' LIMIT 1;
   ```
3. Copie token-ul: `figuroo_admin_default_change_me`

### Pasul 2: Login în App

1. Deschide `https://figuroo.vercel.app`
2. Introdu tokenul: `figuroo_admin_default_change_me`
3. Intră în **Settings** → **Secțiunea Administrator**
4. Generează token nou propriu pentru siguranță
5. Șterge token-ul default

---

## 🔐 Best Practices Securitate

### ✅ Ce să faci:

1. **Schimbă token-ul default imediat după deploy**
   ```sql
   DELETE FROM admin_tokens WHERE name = 'Default Token - Schimbă-l!';
   INSERT INTO admin_tokens (token, name) 
   VALUES ('your_super_secret_token_here', 'Production Token');
   ```

2. **Setează expirare pentru tokeni**
   - Din Settings, generează tokeni cu dată de expirare

3. **Monitorizează usage**
   - Verifică `last_used_at` și `usage_count` pe tokeni

4. **Fă backup la baza de date**
   - Supabase free include backup automat zilnic

### ❌ Nu face:

- ❌ Nu pushu credențiale în GitHub
- ❌ Nu folosi token-ul default în producție
- ❌ Nu dai deploy cu `ACCESS_TOKEN` în env

---

## 🆘 Troubleshooting

### "Error: Database connection failed"

```bash
# Verifică connection string din Supabase
# Asigură-te că IP-ul public e in PostgreSQL allow list
# Supabase → Settings → Database → IPv4 Restrictions → Allow All (pentru free plan)
```

### "CORS error"

```typescript
// Actualizează CORS in app.ts cu URL-ul Vercel
app.use(cors({
  origin: "https://figuroo.vercel.app"
}));
```

### "Vercel build fails"

```bash
# Local test
npm run build

# Verifica Node version în Vercel: 18+
# Set NODE_ENV=production în Vercel env vars
```

---

## 📊 Limitări Plan Free

| Service | Limit Free | Upgrade |
|---------|-----------|---------|
| **Supabase** | 500MB DB, 2GB storage | $25/month |
| **Render** | 0.5 CPU, 512MB RAM | $7/month |
| **Vercel** | 100GB bandwidth | $20/month |

---

## 🚀 Următorii Pași

1. Configurează email notifications (opțional)
2. Adaugă Google Analytics
3. Setează domeniu custom
4. Automatizează backups

---

## 📞 Support

- **Supabase**: https://supabase.com/docs
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **GitHub Issues**: https://github.com/internetsafetylab/figuroo/issues

---

**Gata! 🎉 Aplicația ta e live pe hosting free!**

Powered by Figuroo | Made with ❤️
