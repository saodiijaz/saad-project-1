# BRIEF-UI-016: Karta över föreningar

## Status
🟡 **NEEDS-INPUT** — Körs INTE av Cowork förrän Zivar väljer kart-bibliotek.

## Beslut som behövs
Välj ett av följande, sen kompletterar FORGE denna brief med exakt kod:

| Alternativ | Fördelar | Nackdelar |
|---|---|---|
| **Google Maps** (react-native-maps) | Bäst UX, välkänd UI | Kräver Google Cloud API-nyckel, kostnad över kvot |
| **MapLibre** (@maplibre/maplibre-react-native) | Open source, gratis, OpenStreetMap | Mer setup, något tyngre |
| **Mapbox** (rnmapbox/maps) | Snygg, snabb | Kräver Mapbox-konto, kostnad över kvot |

Rekommendation för MVP: **react-native-maps + Google Maps** (enklast att komma igång, gratis kvot räcker tills appen har tusentals användare).

## Mål (oavsett val)
Ny flik eller knapp som visar en karta med markers för varje förening. Klick på marker → mini-popup → kan navigera till club-profil.

## Förutsättningar
- BRIEF-DB-007 körd (cities med lat/lng)
- Långsiktigt: varje klubb bör ha egen latitude/longitude, inte bara city
- MVP: använd city.latitude/longitude för alla klubbar i samma stad (de hamnar på varandra men är acceptabelt)

## Skisserad setup (Google Maps, kompletteras efter val)

```bash
cd apps/mobile
npx expo install react-native-maps
```

`app.json` → Android:
```json
"android": {
  "config": {
    "googleMaps": { "apiKey": "ZIVAR_FYLLER_IN" }
  }
}
```

iOS-nyckel sätts via AppDelegate eller config-plugin.

## Steg — placeholder
Fylls i när val är gjort. Kommer innehålla:
- `apps/mobile/app/map.tsx` (eller som tab)
- `apps/mobile/lib/data.ts` — `getClubsWithCoords()`
- Markers + popup med klubbnamn
- Click → navigate till `/club/[id]`

## Verifiering
- [ ] Karta renderas
- [ ] Markers visas på rätt stad
- [ ] Klick navigerar till club-profil

## Rollback
Ta bort app/map.tsx, ta bort dep, clean build.

---

**Cowork:** Hoppa denna brief tills Zivar svarat via ny brief-revision från FORGE.
