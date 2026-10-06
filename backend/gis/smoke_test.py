"""Live smoke check against the VIATOR POI API and the configured OSRM service."""

from __future__ import annotations

import json
import os

from route_engine import OSRMClient, POILoader, RouteEngine


TEST_ROUTES = {
    "kochi_munnar": {
        "origin": {"latitude": 9.9658, "longitude": 76.2421},
        "destination": {"latitude": 10.0889, "longitude": 77.0595},
    },
    "kochi_varkala": {
        "origin": {"latitude": 9.9658, "longitude": 76.2421},
        "destination": {"latitude": 8.7379, "longitude": 76.7163},
    },
}
PREFERENCES = ("fastest", "scenic", "nature", "food", "culture", "hidden-gems")


def main() -> int:
    api_url = os.environ.get("VIATOR_POI_API_URL", "http://localhost:5000/api/v1/pois")
    pois = POILoader(api_url).load(os.environ.get("VIATOR_POIS_FILE"))
    osrm = OSRMClient(os.environ.get("OSRM_BASE_URL", "https://router.project-osrm.org"))
    engine = RouteEngine(pois, osrm=osrm)
    output = {"success": True, "poiCount": len(pois), "routes": {}, "preferenceRankingChanged": False}

    try:
        for route_name, endpoints in TEST_ROUTES.items():
            results = {}
            for preference in PREFERENCES:
                result = engine.plan({**endpoints, "preference": preference})
                candidates = result["candidates"]
                if not candidates:
                    raise AssertionError(f"{route_name}/{preference}: no route candidate returned")
                if sum(candidate["recommended"] for candidate in candidates) != 1:
                    raise AssertionError(f"{route_name}/{preference}: expected exactly one recommended candidate")
                for candidate in candidates:
                    geometry = candidate["geometry"]
                    if geometry.get("type") != "LineString" or len(geometry.get("coordinates", [])) < 2:
                        raise AssertionError(f"{route_name}/{preference}: invalid route geometry")
                    if candidate["distanceMeters"] <= 0 or candidate["durationSeconds"] <= 0:
                        raise AssertionError(f"{route_name}/{preference}: invalid OSRM metrics")
                    if candidate["nearbyPoiCount"] != len(candidate["nearbyPois"]):
                        raise AssertionError(f"{route_name}/{preference}: POI count does not match evidence")
                results[preference] = result

            fastest_id = results["fastest"]["recommendedCandidateId"]
            for preference in ("scenic", "nature", "culture"):
                result = results[preference]
                if result["preferenceSupported"] and result["recommendedCandidateId"] != fastest_id:
                    output["preferenceRankingChanged"] = True
            unsupported = results["hidden-gems"]["preferenceSupported"] is False
            output["routes"][route_name] = {
                "candidateCount": results["fastest"]["candidateCount"],
                "candidateIds": [candidate["candidateId"] for candidate in results["fastest"]["candidates"]],
                "recommendedByPreference": {
                    preference: results[preference]["recommendedCandidateId"]
                    for preference in PREFERENCES
                },
                "supportedPreferences": {
                    preference: results[preference]["preferenceSupported"]
                    for preference in PREFERENCES
                },
                "unsupportedPreferences": [
                    preference for preference in PREFERENCES
                    if not results[preference]["preferenceSupported"]
                ],
                "hiddenGemsHonestUnsupported": unsupported,
                "candidateEvidence": [
                    {
                        "candidateId": candidate["candidateId"],
                        "distanceMeters": round(candidate["distanceMeters"], 1),
                        "durationSeconds": round(candidate["durationSeconds"], 1),
                        "nearbyPoiCount": candidate["nearbyPoiCount"],
                        "categoryCounts": candidate["categoryCounts"],
                    }
                    for candidate in results["fastest"]["candidates"]
                ],
            }
            if not unsupported:
                raise AssertionError(f"{route_name}: hidden-gems unexpectedly had no evidence but was marked supported")
    except Exception as error:
        output = {"success": False, "error": str(error), "partialResults": output}
        print(json.dumps(output, ensure_ascii=False, allow_nan=False))
        return 1

    print(json.dumps(output, ensure_ascii=False, allow_nan=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
