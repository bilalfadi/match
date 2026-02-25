# Waha se link kyun nahi aa rahe aur kaise aayenge

## Short

- **Unki site** (streameast, xstreameast, livekora) pe stream link **HTML me ready nahi** hota; kabhi **JS se** set hota hai, kabhi **ad/click ke baad**.
- Hum **static HTML fetch** + **raw HTML me URL dhundhna** + **browser (Puppeteer)** try karte hain. Jahan source **real URL HTML/iframe me de deta hai**, wahan link aa jata hai.

---

## 1. Kyun link nahi aa rahe (waja)

### Streameast (streameast.gl)

- Listing se detail page URL mil jata hai (e.g. `/soccer/748393/alaves-vs-girona`).
- **Static fetch:** Detail page ka HTML me kabhi **iframe `src` empty** ya **`javascript:false`** hota hai; real stream URL **baad me JavaScript** se set hota hai (ya user click ke baad).
- **Browser fetch:** Puppeteer se page kholne pe bhi iframe ka `src` kabhi **javascript:false** ya **empty** hi rehta hai; site shayad **user interaction / ad** ke baad hi real URL set karti hai.
- **Raw HTML scan:** Jahan page me **givemereddit**, **gooz**, **hesgoal** jaisa URL **script/HTML me likha** hota hai, wahan se link mil jata hai. Jahan URL **XHR/fetch** se aata hai (HTML me kabhi nahi likha), wahan hume nahi milta.

### Xstreameast (xstreameast.xyz / xstreameast.com)

- Detail page pe **sirf `about:blank` iframe** milta hai; real stream **doosri domain** pe ya **click ke baad** load hota hai.
- Hum **about:blank** reject karte hain, isliye wahan se koi link accept nahi hota.

### Livekora (livekora.vip)

- Yahan **listing URL hi direct stream/embed** hai; hum use hi use karte hain. Jahan ye valid URL hai wahan link **aa jata hai**.

---

## 2. Kaise link aate hain (jo abhi ho raha hai)

1. **Static fetch**  
   Detail page ka HTML fetch karke:
   - **iframe `src`** nikaalte hain (jo valid stream URL ho).
   - **Scripts / raw HTML** me **givemereddit, gooz, hesgoal, stream*.com|net|io|tv** jaisi URLs dhundhte hain.
   - **about:blank**, **javascript:false**, **YouTube live_chat**, **listing/category** URLs reject karte hain.

2. **Browser fetch (Puppeteer)**  
   Jab static se kuch na mile:
   - Detail page **headless browser** me kholte hain.
   - Thoda **wait** karte hain, **play button** type cheez pe click try karte hain.
   - Phir **iframe `src`** aur **page HTML** me wahi stream patterns dhundhte hain.
   - Jahan site **JS se iframe src set karti hai** (bina ad/click ke), wahan link mil sakta hai.

3. **Detail page pe open hone pe**  
   User jab **hamari** match detail page kholta hai:
   - Pehle **stored streamUrl** use karte hain (agar sync me mil chuka ho).
   - Nahi to **source detail URL** se phir **static + browser fetch** try karte hain aur jo valid URL mile woh **detail page pe embed** me dikhate hain.

---

## 3. Aur kaise aa sakte hain (options)

- **Naye stream domains:** Agar pata chale unki site **kisi aur domain** pe stream deti hai (e.g. naya CDN), to `STREAM_HOST_PATTERNS` / `streamKeywords` me woh pattern add karna hoga (`parseStreamIframeFromHtml.ts` aur `browserFetchDetailPage.ts`).
- **Network / API:** Agar stream URL **kisi API response** me aata hai to hume woh endpoint/format chahiye; abhi hum sirf **HTML + iframe** se nikaal rahe hain.
- **Browser + interaction:** Agar site **ad/button click** ke baad hi iframe set karti hai, to Puppeteer me **specific button selector** ya **wait for navigation** add karke try kiya ja sakta hai (har site ke hisaab se alag).

---

## 4. Files jahan logic hai

- **Parser / filters:** `src/lib/sources/parseStreamIframeFromHtml.ts`  
  - iframe/script se URL nikalna, invalid/listing/non-stream reject karna.
- **Raw HTML patterns:** `parseStreamIframeFromHtml.ts` (STREAM_HOST_PATTERNS), `browserFetchDetailPage.ts` (extractStreamUrlsFromRawHtml).
- **Browser fetch:** `src/lib/sources/browserFetchDetailPage.ts`  
  - Puppeteer se detail page kholna, iframe + HTML scan.
- **Sync / detail resolve:** `src/lib/sources/index.ts`, `src/app/api/matches/[id]/route.ts`  
  - Static → browser fallback, detail page pe stream resolve.

Is hisaab se: **jahan source real stream URL HTML/iframe me de raha hai wahan link aa rahe hain; jahan URL sirf JS/ad/click ke baad set hota hai wahan abhi nahi aa pa raha.** Naye patterns ya browser steps se thoda aur improve ho sakta hai.
