# Unforgettable Travel Pictures

A simple site where travelers upload photos to the trip they went on.
Hosted on Netlify; photos are stored in Netlify Blobs (no other service needed).

## One-time setup on Netlify
1. Netlify → your site → **Site configuration → Build & deploy**: make sure it is linked to the GitHub repo `ServingSeeds/Unforgettable-Travel-Pictures`, branch `main`. Leave build command empty; publish directory is read from `netlify.toml`.
2. **Site configuration → Environment variables → Add a variable**
   - Key: `UPLOAD_CODE`
   - Value: the code travelers must type (e.g. `ark2026`)
3. **Deploys → Trigger deploy → Deploy site**.

## Add a new trip
Edit `public/trips.json` on GitHub (pencil icon), copy a trip block, change it, and commit:

```json
{
  "id": "nashville-2027",
  "name": "Nashville Weekend",
  "dates": "March 2027",
  "description": "Opryland and downtown."
}
```
The `id` may only use lowercase letters, numbers and dashes. Put a comma between trips.

## Share with travelers
Send each group:  `https://YOUR-SITE.netlify.app/trip.html?id=nashville-2027`  plus the trip code.

## Remove a photo
Netlify → your site → **Blobs** → store `trip-photos` → find the trip folder → delete the photo.
