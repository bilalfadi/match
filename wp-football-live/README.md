# WordPress (cPanel) version – Football Live

Is folder mein **wp-content** ka ready theme + plugin hai.

## Install

1. Apni domain par WordPress install karo (cPanel).
2. Upload:
   - `wp-football-live/wp-content/themes/football-live/` → `wp-content/themes/football-live/`
   - `wp-football-live/wp-content/plugins/football-live-core/` → `wp-content/plugins/football-live-core/`
3. WP Admin → **Appearance → Themes** → **Football Live** activate
4. WP Admin → **Plugins** → **Football Live Core** activate

## Home page

- WP Admin → **Settings → Reading** → “Your homepage displays” → **A static page**
- “Homepage” page banao aur **Homepage** select karo

## Categories (same URLs)

Next.js jaisi URLs ke liye categories banao:
- `news`
- `football`
- `premier-league`

Posts in categories homepage pe sections mein aa jayenge.

## Matches

WP Admin → **Matches → Add Match**
- **Match Page URL** paste karo
- Save/Publish

Plugin save par page fetch karke:
- Teams (title se)
- Stream iframe URL (HTML se)
extract karta hai.

**Agar stream URL na mile** to match automatically **Draft** ho jata hai (homepage par show nahi hota).

## Shortcode

Theme homepage pe use hota:

`[football_live_matches status="LIVE" limit="10"]`

