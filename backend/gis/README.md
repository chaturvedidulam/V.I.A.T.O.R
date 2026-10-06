# VIATOR GIS route engine

This standalone Python CLI requests real driving routes from OSRM, measures the existing VIATOR POI dataset around each route, and applies transparent preference weights. It is a deterministic scoring engine, not a trained ML model.

## Install

From the repository root:

```powershell
python -m pip install -r backend/gis/requirements.txt
```

## Run

The Node POI API must be available at `http://localhost:5000/api/v1/pois` (or set `VIATOR_POI_API_URL`). Input is one JSON object on stdin:

```powershell
'{"origin":{"latitude":9.9658,"longitude":76.2421},"destination":{"latitude":10.0889,"longitude":77.0595},"preference":"scenic"}' | python backend/gis/route_engine.py
```

To use an exported array/envelope of POI API records instead, pass `--pois-file path\to\pois.json`. The engine does not access Firestore directly.

Preferences: `fastest`, `scenic`, `nature`, `food`, `culture`, and `hidden-gems`. Unsupported preferences return `preferenceSupported: false`, null candidate scores, and a fastest-route fallback recommendation.

Defaults can be configured with `--max-candidates` (1–5), `--corridor-meters` (5,000), `--pois-url`, and `--osrm-url`. OSRM requests are cached in memory for the lifetime of the process.

## Integration smoke check

With the POI API reachable and internet access to OSRM, run:

```powershell
python backend/gis/smoke_test.py
```

It checks Kochi–Munnar and Kochi–Varkala with fastest, scenic, nature, culture, and hidden-gems preferences.

## Scoring

POI evidence is measured as `log(1 + category count × 100,000 / route distance in metres)` and min-max normalized across candidates. Equal positive evidence normalizes to 1 for every candidate; equal zero evidence normalizes to 0. Duration and distance are min-max normalized, where 0 is best. This means sparse evidence can still distinguish candidates; inspect the raw counts and evidence level alongside any score. Scores are deterministic product rules, not machine learning.

| Preference | Evidence weights | Duration | Distance |
|---|---|---:|---:|
| Fastest | Duration only: 1.00 | — | — |
| Scenic | Mapped nature .10, waterfall .10, viewpoint .20, beach .15, wildlife .15, park .10 | .10 | .10 |
| Nature | Nature .25, waterfall .15, wildlife .25, park .15 | .10 | .10 |
| Food | Food .80 | .10 | .10 |
| Culture | Heritage .35, museum .25, religious .20 | .10 | .10 |
| Hidden-gems | Explicit `hidden-gem` POI tags .80 | .10 | .10 |

Each candidate retains the legacy `categoryCounts` and adds explicit `natureCount`, `waterfallCount`, `wildlifeCount`, `parkCount`, `beachCount`, `foodCount`, `heritageCount`, `museumCount`, and `religiousCount`. `categoryCountPer100Km` reports each evidence category count divided by route distance in km and multiplied by 100. `evidence.categoryCounts` also includes viewpoint and explicit hidden-gem tag counts. No evidence is fabricated; absent categories have count zero.

`evidence` reports nearby POI count, matched categories, category counts, corridor width, an evidence level and a meaning note. Levels use total nearby POI count: none = 0, sparse = 1–2, moderate = 3–7, strong = 8+. These levels mean only the amount of mapped OSM/VIATOR evidence found near the route. They do not describe route quality, popularity, real-world completeness, scenic quality or satisfaction.

`detourFromFastestMeters` and `detourFromFastestSeconds` remain. `detourFromFastestPercent` is distance detour relative to the fastest candidate; `detourFromFastestDurationPercent` is duration detour relative to its duration. Both are zero-safe and are relative route detour, not traffic cost.

Scenic is only a **mapped scenic evidence proxy** based on nearby mapped nature, viewpoints, beaches, waterfalls, wildlife and parks. It does not claim the road itself is scenic or that these features are visible from it. Food is supported only if matching food POIs are actually present in the current POI dataset; this seed does not explicitly query restaurants/cafes, so food may be unsupported. Hidden-gems is unsupported unless POI records contain an explicit `hidden-gem` tag. Zero/missing ratings, low counts, rarity and distance are never used to infer hidden-gem status. If a preference has no matching corridor evidence, scores are null and the fastest OSRM candidate is recommended as fallback.

OSM POI coverage is incomplete and can vary by place and category. The engine depends on the existing VIATOR POI API (whose imported content comes from OSM/Overpass) and the public OSRM routing service by default. These public services may be unavailable or rate-limited and do not provide guaranteed coverage or uptime. Ties are resolved by OSRM duration, then candidate ID.

## Data and limits

POIs come from the existing read-only `GET /api/v1/pois` API or an exported JSON representation. Route corridors are buffered in a projected local UTM CRS through GeoPandas/OSMnx before point inclusion tests. The buffer defaults to 5 km. Nearby POI IDs, names, categories, tags, and measured distance-to-route are returned as evidence.

Candidate generation first asks OSRM for alternatives. If fewer than two distinct geometries remain, a NetworkX stop graph selects up to three imported POIs located along and offset from the fastest route. OSRM routes both legs through each waypoint; no straight-line connector is inserted when the snapped leg endpoints do not coincide within 1 m. Similar candidate geometries are clustered by projected Hausdorff distance (≤300 m) and length difference (≤4%), retaining the shortest-duration route per cluster.

No ratings, traffic, tolls, elevation, hidden-gem status, or ML predictions are inferred. OSM-derived POI data remains governed by its source licensing and attribution obligations; see `../src/scripts/OSM_DATA_ATTRIBUTION.md`.
# Node API gateway

The backend mounts `POST /api/v1/routes/plan` as a public route planning endpoint. Install the Python packages listed in `requirements.txt` in the environment used by the backend.

Set `VIATOR_PYTHON_PATH` in the backend environment when Python is not available under the platform default (`python` on Windows, `python3` elsewhere). The Node service executes only this fixed `route_engine.py` file and sends the validated request JSON over stdin. It does not create a virtual environment or install packages. The process timeout is 120 seconds.

Request body:

```json
{
  "origin": { "latitude": 9.9312, "longitude": 76.2673 },
  "destination": { "latitude": 10.0889, "longitude": 76.9514 },
  "preference": "nature"
}
```

The API responds with the standard `{ success, message, data }` envelope; `data` is the route engine result. Missing Python returns 503, a timeout returns 504, and invalid or failed engine output returns a non-stack-trace 502 response.
