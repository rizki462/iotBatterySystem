# Panduan Membangun Aplikasi IoT Supercap (NestJS + Next.js + VPS)

Panduan langkah demi langkah dari nol sampai ESP32 mengirim data ke VPS sendiri.
Setiap fase punya penanda **Selesai kalau...** supaya kamu tahu kapan boleh lanjut.

## Arsitektur

```
ESP32 --POST JSON + X-Device-Key--> NestJS --> PostgreSQL
        <-- {ok, cmd: "none" | "restart" | "sleep"} --
                                      ^
Next.js dashboard --REST + JWT--------+
```

- ESP32 mengirim ke **satu endpoint** (`POST /api/ingest`). Tidak ada Blynk, Google Sheets, atau panggilan OpenWeatherMap dari ESP32.
- Perintah dari dashboard (misalnya reset) disimpan di database, lalu dikirim lewat **balasan** saat ESP32 bangun dan mengirim data berikutnya. Tidak ada koneksi tambahan, jadi tidak ada energi tambahan.
- Reset dari web **tidak bisa menghidupkan alat yang mati**, karena alat yang mati tidak membaca perintah apa pun.

## Struktur akhir repositori

```
iot-supercap/
├─ apps/api/      (NestJS)
├─ apps/web/      (Next.js)
├─ deploy/        (docker-compose, Caddyfile)
└─ firmware/      (kode ESP32)
```

## Kontrak API

**Alat -> server** (`POST /api/ingest`, header `X-Device-Key`):

```json
{
  "device_id": "esp32c3-01",
  "vcap": 4.02,
  "status": "medium",
  "predicted_v": 4.07,
  "sleep_s": 1800,
  "reset_reason": "poweron",
  "boot_count": 42,
  "wifi_ms": 1450,
  "active_ms": 3100
}
```

**Server -> alat** (balasan):

```json
{ "ok": true, "cmd": "none" }
```

`cmd` bisa `none`, `restart`, atau `sleep` (dengan `sleep_s`).

Server mencatat waktu saat data masuk (`received_at`). Alat tidak perlu sinkron NTP.

**Dashboard -> server** (JWT): `POST /api/auth/login`, `GET /api/readings?from=&to=`, `GET /api/stats/status`, `POST /api/commands`.

## Skema database

| Tabel | Kolom utama |
|---|---|
| `devices` | id, name, device_key_hash, last_seen_at |
| `readings` | id, device_id, received_at, vcap, status, predicted_v, sleep_s, reset_reason, boot_count, wifi_ms, active_ms |
| `commands` | id, device_id, type, payload, created_at, delivered_at |
| `users` | id, email, password_hash |

---

## Fase 0: Siapkan alat

Di laptop: **Node.js 20 atau 22 LTS**, **Git**, dan **Docker Desktop**. Di VPS: Docker dan Docker Compose (dipakai di Fase 6).

```bash
node -v && git --version && docker --version
```

Siapkan juga akun GitHub atau GitLab.

**Selesai kalau:** ketiga perintah di atas menampilkan versi.

---

## Fase 1: Git dan struktur proyek

```bash
mkdir iot-supercap && cd iot-supercap
git init -b main
mkdir apps deploy firmware
```

Buat `.gitignore` di root:

```
node_modules
dist
.next
.env
.env.*
!.env.example
```

Commit pertama dan sambungkan ke remote:

```bash
git add . && git commit -m "chore: init monorepo"
git remote add origin <url-repo-kamu>
git push -u origin main
```

> **Jangan pernah commit `.env`.** Token Blynk, API key OpenWeatherMap, dan URL Apps Script lama sudah terlihat di percakapan, jadi anggap semuanya bocor. Buat yang baru kalau masih dipakai.

**Selesai kalau:** repo sudah ada di GitHub dan `.env` tidak ikut terunggah.

---

## Fase 2: Database lokal

Buat `deploy/docker-compose.dev.yml`:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: iot
      POSTGRES_PASSWORD: devpass
      POSTGRES_DB: iot
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
volumes:
  pgdata:
```

Jalankan:

```bash
docker compose -f deploy/docker-compose.dev.yml up -d
docker ps
```

**Selesai kalau:** container `db` berstatus running.

---

## Fase 3: Backend NestJS

```bash
npm i -g @nestjs/cli
cd apps
nest new api --skip-git --package-manager npm
cd api
npm i @nestjs/config @nestjs/typeorm typeorm pg @nestjs/jwt @nestjs/passport \
  passport passport-jwt bcrypt class-validator class-transformer @nestjs/throttler
npm i -D @types/passport-jwt @types/bcrypt
```

Buat modul-modulnya:

```bash
for m in devices readings commands auth ingest; do
  nest g module $m && nest g controller $m && nest g service $m
done
```

Buat `apps/api/.env` (dan `.env.example` dengan nilai kosong, yang boleh di-commit):

```
DATABASE_URL=postgres://iot:devpass@localhost:5432/iot
JWT_SECRET=<string-acak-panjang>
DEVICE_KEY=<string-acak-panjang>
PORT=3001
```

Contoh membuat string acak: `openssl rand -hex 32`.

Di `src/main.ts`:

```ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: 'http://localhost:3000' }); // hanya untuk dev
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
```

Port diubah ke **3001** karena Next.js memakai 3000 secara default.

Buat entity untuk tabel `devices`, `readings`, `commands`, dan `users` sesuai skema di atas. Selama pengembangan boleh memakai `synchronize: true` di konfigurasi TypeORM. Untuk produksi, pakai migrasi.

Urutan pengerjaan:

1. **`POST /api/ingest`**: cek header `X-Device-Key`, simpan ke `readings`, balas `{ok, cmd}`.
2. **`GET /api/readings`** dan **`GET /api/stats/status`**.
3. **Auth JWT**: login dashboard dan guard untuk endpoint di atas.
4. **`POST /api/commands`**: antrean perintah. Dikirim lewat balasan `/ingest`, lalu ditandai `delivered_at`.
5. Tambahkan `@nestjs/throttler` pada endpoint `/ingest` dan `/auth/login`.

Tes dengan curl sebelum lanjut:

```bash
curl -X POST http://localhost:3001/api/ingest \
  -H "X-Device-Key: <DEVICE_KEY>" -H "Content-Type: application/json" \
  -d '{"device_id":"esp32c3-01","vcap":4.02,"status":"medium","predicted_v":4.07,"sleep_s":1800,"reset_reason":"poweron","boot_count":1,"wifi_ms":1450,"active_ms":3100}'
```

**Selesai kalau:** curl menghasilkan `{"ok":true,"cmd":"none"}` dan barisnya muncul di tabel `readings`.

---

## Fase 4: Frontend Next.js

```bash
cd apps
npx create-next-app@latest web --typescript --tailwind --eslint --app --use-npm
cd web
npm i recharts
```

Kalau `create-next-app` membuat folder `.git` di dalam `apps/web`, hapus folder itu.

Simpan URL API di `apps/web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Halaman yang dibuat:

- `/login`
- `/` (dashboard):
  - diagram garis: `vcap` terhadap waktu
  - diagram lingkaran: proporsi status safe / medium / critical
  - kartu "terakhir terlihat" dari `last_seen_at`
- Tombol **Reset** yang memanggil `POST /api/commands`, dengan konfirmasi dan keterangan "dijalankan saat alat bangun berikutnya".

**Selesai kalau:** dashboard menampilkan data dari curl tadi.

---

## Fase 5: Firmware baru

Di `firmware/`, tulis ulang dari kode lama:

- Hapus Blynk, OpenWeatherMap, dan Google Sheets.
- Satu `HTTPClient` POST berisi JSON seperti kontrak di atas, dengan header `X-Device-Key`.
- Baca balasan. Kalau `cmd` bernilai `restart`, panggil `esp_restart()`.
- Catat `esp_reset_reason()`, `boot_count` (di RTC memory), dan `millis()` untuk `wifi_ms` dan `active_ms`.
- Konek WiFi dengan BSSID dan channel tersimpan supaya lebih cepat.
- Pakai `setInsecure()` hanya di masa percobaan. Untuk produksi, ganti ke `setCACert()` dengan sertifikat root.

**Selesai kalau:** alat di meja mengirim data dan barisnya muncul di dashboard.

---

## Fase 6: Deploy ke VPS

1. **Domain:** arahkan A record subdomain (misal `iot.domainmu.com`) ke IP VPS.
2. **Pengamanan dasar VPS:** user non-root, login SSH dengan key, firewall hanya membuka port 22, 80, dan 443 (`ufw`).
3. **Docker:** pasang Docker, buat `Dockerfile` untuk `api` dan `web`, lalu `deploy/docker-compose.prod.yml` berisi `caddy`, `api`, `web`, dan `db`. Port Postgres **tidak** diekspos.
4. **Caddyfile:**

```
iot.domainmu.com {
  handle /api/* { reverse_proxy api:3001 }
  handle { reverse_proxy web:3000 }
}
```

5. Taruh `.env` produksi di VPS (bukan di Git), lalu jalankan:

```bash
git pull && docker compose -f deploy/docker-compose.prod.yml up -d --build
```

**Selesai kalau:** `https://iot.domainmu.com` terbuka dengan gembok HTTPS, dan curl ke `/api/ingest` dari luar berhasil.

---

## Catatan keamanan

- Kunci alat (`DEVICE_KEY`) dan login dashboard (JWT) dipisah.
- Simpan kunci alat sebagai hash di database, dan batasi laju request (rate limit).
- Jangan commit `.env`. Jangan ekspos port database.
- Kalau mengaktifkan CORS di produksi, batasi ke domain dashboard saja. Karena Caddy melayani semuanya dari satu domain, CORS tidak diperlukan di produksi.

## Catatan hardware (jangan terlupa)

Aplikasi hanya berguna kalau alat bisa pulih sendiri tiap pagi. Hasil tes KA75330 menentukan hal itu. Kerjakan Fase 1-4 sambil menunggu hasilnya, karena fase itu tidak bergantung pada kondisi alat.
