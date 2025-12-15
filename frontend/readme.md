# Frontend — DataFusion

Bu dosya, frontend uygulamasının hızlı kurulumunu ve geliştirme rehberini içerir.

## Next.js 15 Kurulumu

- Node.js 18+ yüklü olmalı.
- Bağımlılıkları yükleyin:

```bash
cd frontend
pnpm install
```

- Geliştirme sunucusunu çalıştırma:

```bash
cp .env.local.example .env.local
pnpm dev
```

## Component Yapısı

- `src/app/` — Next.js uygulama sayfaları ve layout
- `src/components/` — yeniden kullanılabilir UI bileşenleri
  - `generation/` — generation UI, DatasetPreview, GenerationInterface
  - `marketplace/` — marketplace listeleri ve kartlar
  - `navigation/`, `ui/` — shared UI bileşenleri
- `src/lib/` — API client ve yardımcılar

## State Yönetimi

- Küçük local state için React `useState`/`useReducer` yeterli.
- Global state veya cache için `React Query`/`SWR` önerilir.
- Projede hafif global state ihtiyaçları varsa `Zustand` tercih edilebilir.

## API Entegrasyon Kalıpları

- Merkezi `apiClient` kullanın: `src/lib/api/client.ts`
- `getAuthToken()` / `getAuthHeader()` ile kimlik bilgisini sağlayın (`src/lib/auth.ts`).
- Tüm HTTP istekleri `apiClient.get/post/put/del` üzerinden yapılmalı.
- Error handling ve retry logic merkezi `apiClient` içinde olmalı.

## Environment Variables

- Kopyalayın: `cp .env.local.example .env.local`
- Örnek değişkenler:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

## Geliştirme İş Akışı

1. Yeni feature branch açın: `git checkout -b feat/your-feature`
2. Geliştirme sırasında `pnpm dev` ile canlı reload kullanın.
3. Unit testler: `pnpm test` (var ise)
4. Kod formatlama/linters: `pnpm lint` / `pnpm format` (projeye göre)

## Deployment

- Frontend tipik olarak Vercel veya Netlify'da deploy edilir. Build komutu:

```bash
pnpm build
pnpm start
```

## İpuçları

- API değişikliklerinde backend ile birlikte `.env` ve `apiClient` ayarlarını kontrol edin.
- Local olarak socket testleri yaparken `NEXT_PUBLIC_WS_URL` ayarının backend ile uyumlu olduğundan emin olun.
