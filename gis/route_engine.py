"""OSRM-backed Kerala route alternatives with auditable POI-based ranking."""

from __future__ import annotations

import argparse
import itertools
import json
import math
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import geopandas as gpd
import networkx as nx
import osmnx as ox
import pandas as pd
import requests
from shapely.geometry import LineString, Point


PREFERENCE_NAMES = {"fastest", "scenic", "nature", "food", "culture", "hidden-gems"}
MAX_CANDIDATES_DEFAULT = 5
MAX_WAYPOINTS = 3
DEFAULT_CORRIDOR_METERS = 5_000
ROUTE_DUPLICATE_HAUSDORFF_METERS = 300
ROUTE_DUPLICATE_LENGTH_RATIO = 0.04
MAX_WAYPOINT_OFFSET_METERS = 35_000
MIN_WAYPOINT_OFFSET_METERS = 1_500

# Transparent preference weights. They are product rules, not learned model parameters.
SCORING_WEIGHTS: dict[str, dict[str, float]] = {
    "scenic": {
        "natureEvidence": 0.20,
        "viewpointEvidence": 0.20,
        "beachEvidence": 0.15,
        "wildlifeEvidence": 0.15,
        "parkEvidence": 0.10,
        "durationPenalty": 0.10,
        "distancePenalty": 0.10,
    },
    "nature": {
        "natureEvidence": 0.40,
        "wildlifeEvidence": 0.25,
        "parkEvidence": 0.15,
        "durationPenalty": 0.10,
        "distancePenalty": 0.10,
    },
    "food": {
        "foodEvidence": 0.80,
        "durationPenalty": 0.10,
        "distancePenalty": 0.10,
    },
    "culture": {
        "heritageEvidence": 0.35,
        "museumEvidence": 0.25,
        "cultureReligiousEvidence": 0.20,
        "durationPenalty": 0.10,
        "distancePenalty": 0.10,
    },
    "hidden-gems": {
        "hiddenGemEvidence": 0.80,
        "durationPenalty": 0.10,
        "distancePenalty": 0.10,
    },
}

CATEGORY_KEYS = (
    "nature", "beach", "waterfall", "wildlife", "heritage", "cultureReligious",
    "attraction", "food", "viewpoint", "park", "museum",
)


class RouteEngineError(RuntimeError):
    """Raised for invalid input or unusable upstream routing/data responses."""


@dataclass(frozen=True)
class Coordinate:
    latitude: float
    longitude: float

    def validate(self, label: str) -> None:
        if not math.isfinite(self.latitude) or not -90 <= self.latitude <= 90:
            raise RouteEngineError(f"{label}.latitude must be between -90 and 90.")
        if not math.isfinite(self.longitude) or not -180 <= self.longitude <= 180:
            raise RouteEngineError(f"{label}.longitude must be between -180 and 180.")


def parse_coordinate(value: Any, label: str) -> Coordinate:
    if not isinstance(value, dict):
        raise RouteEngineError(f"{label} must contain latitude and longitude.")
    try:
        coordinate = Coordinate(float(value["latitude"]), float(value["longitude"]))
    except (KeyError, TypeError, ValueError) as error:
        raise RouteEngineError(f"{label} must contain numeric latitude and longitude.") from error
    coordinate.validate(label)
    return coordinate


def normalize_pois(payload: Any) -> list[dict[str, Any]]:
    """Accept a POI API envelope, API data array, or exported POI JSON array."""
    if isinstance(payload, dict) and "data" in payload:
        payload = payload["data"]
    if not isinstance(payload, list):
        raise RouteEngineError("POI source must return a JSON array or {data: array}.")

    pois: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    for item in payload:
        if not isinstance(item, dict):
            continue
        poi_id = item.get("id")
        name = item.get("name")
        location = item.get("location")
        if not isinstance(location, dict) and "latitude" in item and "longitude" in item:
            location = {"latitude": item["latitude"], "longitude": item["longitude"]}
        if not isinstance(poi_id, str) or not poi_id or not isinstance(name, str) or not name.strip():
            continue
        if poi_id in seen_ids or not isinstance(location, dict):
            continue
        try:
            coordinate = parse_coordinate(location, f"POI {poi_id}")
        except RouteEngineError:
            continue
        category = item.get("category") if isinstance(item.get("category"), str) else "other"
        tags = item.get("tags") if isinstance(item.get("tags"), list) else []
        seen_ids.add(poi_id)
        pois.append({
            "id": poi_id,
            "name": name.strip(),
            "category": category.strip().lower(),
            "tags": [tag.strip().lower() for tag in tags if isinstance(tag, str)],
            "latitude": coordinate.latitude,
            "longitude": coordinate.longitude,
        })
    return pois


class POILoader:
    def __init__(self, api_url: str, timeout_seconds: float = 20) -> None:
        self.api_url = api_url
        self.timeout_seconds = timeout_seconds

    def load(self, json_path: str | None = None) -> list[dict[str, Any]]:
        if json_path:
            try:
                payload = json.loads(Path(json_path).read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as error:
                raise RouteEngineError(f"Unable to read POI JSON file: {error}") from error
        else:
            try:
                response = requests.get(self.api_url, timeout=self.timeout_seconds)
                response.raise_for_status()
                payload = response.json()
            except (requests.RequestException, ValueError) as error:
                raise RouteEngineError(f"Unable to load POIs from {self.api_url}: {error}") from error
        pois = normalize_pois(payload)
        if not pois:
            raise RouteEngineError("POI source returned no valid POIs.")
        return pois


class OSRMClient:
    """Small in-process cache over the OSRM Route service."""

    def __init__(self, base_url: str = "https://router.project-osrm.org", timeout_seconds: float = 30) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds
        self.session = requests.Session()
        self._cache: dict[tuple[float, float, float, float, bool], list[dict[str, Any]]] = {}

    def route(
        self,
        origin: Coordinate,
        destination: Coordinate,
        alternatives: bool,
    ) -> list[dict[str, Any]]:
        key = (
            round(origin.latitude, 6), round(origin.longitude, 6),
            round(destination.latitude, 6), round(destination.longitude, 6), alternatives,
        )
        if key in self._cache:
            return self._cache[key]

        coordinates = f"{origin.longitude:.6f},{origin.latitude:.6f};{destination.longitude:.6f},{destination.latitude:.6f}"
        url = f"{self.base_url}/route/v1/driving/{coordinates}"
        params = {
            "alternatives": "true" if alternatives else "false",
            "overview": "full",
            "geometries": "geojson",
            "steps": "false",
        }
        try:
            response = self.session.get(url, params=params, timeout=self.timeout_seconds)
            response.raise_for_status()
            payload = response.json()
        except (requests.RequestException, ValueError) as error:
            raise RouteEngineError(f"OSRM request failed: {error}") from error

        if not isinstance(payload, dict) or payload.get("code") != "Ok":
            code = payload.get("code", "malformed response") if isinstance(payload, dict) else "malformed response"
            raise RouteEngineError(f"OSRM returned code {code}.")
        routes = payload.get("routes")
        if not isinstance(routes, list) or not routes:
            raise RouteEngineError("OSRM returned no routes.")

        valid_routes: list[dict[str, Any]] = []
        for route in routes:
            try:
                distance = float(route["distance"])
                duration = float(route["duration"])
                geometry = route["geometry"]
                coordinates = geometry["coordinates"]
                if geometry.get("type") != "LineString" or len(coordinates) < 2:
                    continue
                parsed_coordinates = []
                for pair in coordinates:
                    if not isinstance(pair, list) or len(pair) < 2:
                        raise ValueError("bad coordinate pair")
                    longitude, latitude = float(pair[0]), float(pair[1])
                    if not math.isfinite(longitude) or not math.isfinite(latitude):
                        raise ValueError("non-finite coordinate")
                    if not -180 <= longitude <= 180 or not -90 <= latitude <= 90:
                        raise ValueError("coordinate outside WGS84 range")
                    parsed_coordinates.append([longitude, latitude])
                if distance <= 0 or duration <= 0 or len(parsed_coordinates) < 2:
                    continue
                valid_routes.append({
                    "distanceMeters": distance,
                    "durationSeconds": duration,
                    "geometry": {"type": "LineString", "coordinates": parsed_coordinates},
                })
            except (KeyError, TypeError, ValueError, AttributeError):
                continue
        if not valid_routes:
            raise RouteEngineError("OSRM returned no routes with valid LineString geometry.")
        self._cache[key] = valid_routes
        return valid_routes


def line_from_geojson(geometry: dict[str, Any]) -> LineString:
    if geometry.get("type") != "LineString":
        raise RouteEngineError("Route geometry must be a GeoJSON LineString.")
    line = LineString(geometry.get("coordinates", []))
    if line.is_empty or not line.is_valid or len(line.coords) < 2:
        raise RouteEngineError("Route geometry is empty or invalid.")
    return line


def projected_geometries(
    routes: list[dict[str, Any]],
    pois: list[dict[str, Any]],
) -> tuple[list[LineString], gpd.GeoDataFrame, Any]:
    route_lines = [line_from_geojson(route["geometry"]) for route in routes]
    poi_frame = pd.DataFrame(pois)
    poi_points = [Point(row.longitude, row.latitude) for row in poi_frame.itertuples()]
    all_geometries = [*route_lines, *poi_points]
    frame = gpd.GeoDataFrame({"geometry": all_geometries}, crs="EPSG:4326")
    try:
        projected_frame = ox.projection.project_gdf(frame)
    except Exception as error:
        raise RouteEngineError(f"Unable to project route and POI geometries: {error}") from error
    return (
        list(projected_frame.geometry.iloc[: len(route_lines)]),
        projected_frame.iloc[len(route_lines) :].set_geometry("geometry").reset_index(drop=True),
        projected_frame.crs,
    )


def haversine_meters(a: Coordinate, b: Coordinate) -> float:
    lat1, lat2 = math.radians(a.latitude), math.radians(b.latitude)
    dlat = lat2 - lat1
    dlon = math.radians(b.longitude - a.longitude)
    value = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 6_371_000 * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def choose_waypoints(
    origin: Coordinate,
    destination: Coordinate,
    base_route: dict[str, Any],
    pois: list[dict[str, Any]],
    needed: int,
) -> list[dict[str, Any]]:
    """Use a small NetworkX stop graph to find POIs between and off the base route."""
    if needed <= 0 or not pois:
        return []
    lines, projected_pois, _ = projected_geometries([base_route], pois)
    base_line = lines[0]
    graph = nx.DiGraph()
    graph.add_node("origin")
    graph.add_node("destination")
    candidate_meta: dict[str, tuple[dict[str, Any], float]] = {}

    for row in projected_pois.itertuples():
        poi = pois[row.Index]
        point = row.geometry
        progress = base_line.project(point, normalized=True)
        offset = base_line.distance(point)
        if not 0.10 <= progress <= 0.90:
            continue
        if not MIN_WAYPOINT_OFFSET_METERS <= offset <= MAX_WAYPOINT_OFFSET_METERS:
            continue
        node = f"poi:{poi['id']}"
        candidate_meta[node] = (poi, progress)
        point_coordinate = Coordinate(poi["latitude"], poi["longitude"])
        detour_proxy = (
            haversine_meters(origin, point_coordinate) + haversine_meters(point_coordinate, destination)
        )
        # Prefer visible route departures and interior stops, while keeping the proxy deterministic.
        route_length = max(base_line.length, 1)
        weight = detour_proxy + max(0.0, 5_000 - offset) * 2 + abs(progress - 0.5) * route_length * 0.08
        graph.add_edge("origin", node, weight=weight)
        graph.add_edge(node, "destination", weight=0.0)

    if not candidate_meta:
        return []

    selected: list[dict[str, Any]] = []
    selected_progress: list[float] = []
    try:
        paths = nx.shortest_simple_paths(graph, "origin", "destination", weight="weight")
        for path in itertools.islice(paths, min(len(candidate_meta), needed * 12)):
            waypoint_node = next((node for node in path if node.startswith("poi:")), None)
            if waypoint_node is None:
                continue
            poi, progress = candidate_meta[waypoint_node]
            if any(abs(progress - prior) < 0.10 for prior in selected_progress):
                continue
            selected.append(poi)
            selected_progress.append(progress)
            if len(selected) >= needed:
                break
    except nx.NetworkXNoPath:
        return []
    return selected


def route_candidates(
    origin: Coordinate,
    destination: Coordinate,
    pois: list[dict[str, Any]],
    osrm: OSRMClient,
    max_candidates: int,
) -> tuple[list[dict[str, Any]], list[str]]:
    errors: list[str] = []
    raw_alternatives = osrm.route(origin, destination, alternatives=True)
    candidates = []
    for index, route in enumerate(raw_alternatives[:max_candidates], start=1):
        candidates.append({"candidateId": f"osrm-{index}", "source": "osrm_alternative", **route})

    candidates = deduplicate_routes(candidates)
    if len(candidates) >= 2 or len(candidates) >= max_candidates:
        return candidates, errors

    fastest = min(candidates, key=lambda candidate: candidate["durationSeconds"])
    waypoint_limit = min(MAX_WAYPOINTS, max_candidates - len(candidates))
    waypoints = choose_waypoints(origin, destination, fastest, pois, waypoint_limit)
    for index, poi in enumerate(waypoints, start=1):
        waypoint = Coordinate(poi["latitude"], poi["longitude"])
        try:
            first_routes = osrm.route(origin, waypoint, alternatives=False)
            second_routes = osrm.route(waypoint, destination, alternatives=False)
            first = min(first_routes, key=lambda route: route["durationSeconds"])
            second = min(second_routes, key=lambda route: route["durationSeconds"])
            first_coordinates = first["geometry"]["coordinates"]
            second_coordinates = second["geometry"]["coordinates"]
            join_gap = haversine_meters(
                Coordinate(first_coordinates[-1][1], first_coordinates[-1][0]),
                Coordinate(second_coordinates[0][1], second_coordinates[0][0]),
            )
            if join_gap > 1:
                errors.append(f"Skipped waypoint {poi['id']}: OSRM leg geometries end {join_gap:.0f} m apart.")
                continue
            combined_coordinates = first_coordinates + second_coordinates[1:]
            candidate = {
                "candidateId": f"waypoint-{index}-{poi['id']}",
                "source": "osrm_poi_waypoint",
                "waypointPoiId": poi["id"],
                "waypointPoiName": poi["name"],
                "distanceMeters": first["distanceMeters"] + second["distanceMeters"],
                "durationSeconds": first["durationSeconds"] + second["durationSeconds"],
                "geometry": {"type": "LineString", "coordinates": combined_coordinates},
            }
            candidates.append(candidate)
        except RouteEngineError as error:
            errors.append(f"Skipped waypoint {poi['id']} ({poi['name']}): {error}")

    return deduplicate_routes(candidates)[:max_candidates], errors


def deduplicate_routes(candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if len(candidates) < 2:
        return candidates
    projected_lines, _, _ = projected_geometries(candidates, [])
    graph = nx.Graph()
    graph.add_nodes_from(candidate["candidateId"] for candidate in candidates)
    line_by_id = {
        candidate["candidateId"]: line
        for candidate, line in zip(candidates, projected_lines, strict=True)
    }
    for left, right in itertools.combinations(candidates, 2):
        a, b = line_by_id[left["candidateId"]], line_by_id[right["candidateId"]]
        length_ratio = abs(a.length - b.length) / max(a.length, b.length, 1)
        if a.hausdorff_distance(b) <= ROUTE_DUPLICATE_HAUSDORFF_METERS and length_ratio <= ROUTE_DUPLICATE_LENGTH_RATIO:
            graph.add_edge(left["candidateId"], right["candidateId"])

    candidates_by_id = {candidate["candidateId"]: candidate for candidate in candidates}
    retained: list[dict[str, Any]] = []
    for component in nx.connected_components(graph):
        retained.append(min(
            (candidates_by_id[candidate_id] for candidate_id in component),
            key=lambda candidate: (candidate["durationSeconds"], candidate["distanceMeters"], candidate["candidateId"]),
        ))
    return sorted(retained, key=lambda candidate: (candidate["durationSeconds"], candidate["candidateId"]))


def _rate(count: int, distance_meters: float) -> float:
    return math.log1p(count * 100_000 / max(distance_meters, 1))


def route_poi_features(
    candidates: list[dict[str, Any]],
    pois: list[dict[str, Any]],
    corridor_meters: float,
) -> list[dict[str, Any]]:
    if not candidates:
        return []
    if not math.isfinite(corridor_meters) or corridor_meters <= 0:
        raise RouteEngineError("corridor_meters must be a positive finite number.")

    route_lines, projected_pois, _ = projected_geometries(candidates, pois)
    output = []
    poi_rows = list(projected_pois.itertuples())
    for candidate, line in zip(candidates, route_lines, strict=True):
        nearby: list[dict[str, Any]] = []
        corridor = line.buffer(corridor_meters)
        for row in poi_rows:
            distance = float(line.distance(row.geometry))
            if corridor.covers(row.geometry):
                poi = pois[row.Index]
                nearby.append({
                    "id": poi["id"],
                    "name": poi["name"],
                    "category": poi["category"],
                    "distanceFromRouteMeters": round(distance, 1),
                    "tags": poi["tags"],
                })
        nearby.sort(key=lambda item: (item["distanceFromRouteMeters"], item["name"], item["id"]))
        category_series = pd.Series([item["category"] for item in nearby], dtype="string")
        counts = category_series.value_counts().to_dict()
        category_counts = {key: int(counts.get(key, 0)) for key in CATEGORY_KEYS}
        category_counts["cultureReligious"] = int(counts.get("culture", 0) + counts.get("religious", 0))
        # Category count collection keeps the normalized key but prevents duplicate data in the response.
        output.append({
            **candidate,
            "nearbyPoiCount": len(nearby),
            "categoryCounts": category_counts,
            "nearbyPois": nearby,
        })
    return output


def normalized_component(values: list[float]) -> list[float]:
    if not values:
        return []
    low, high = min(values), max(values)
    if math.isclose(low, high):
        return [1.0 if high > 0 else 0.0 for _ in values]
    return [(value - low) / (high - low) for value in values]


def add_preference_scores(
    candidates: list[dict[str, Any]],
    preference: str,
) -> tuple[list[dict[str, Any]], bool, str, str]:
    if preference not in PREFERENCE_NAMES:
        raise RouteEngineError(f"preference must be one of: {', '.join(sorted(PREFERENCE_NAMES))}.")
    if not candidates:
        return [], False, "", "No valid route candidates were generated."

    durations = [float(candidate["durationSeconds"]) for candidate in candidates]
    distances = [float(candidate["distanceMeters"]) for candidate in candidates]
    duration_norm = normalized_component(durations)
    distance_norm = normalized_component(distances)
    feature_counts = [candidate["categoryCounts"] for candidate in candidates]
    feature_specs = {
        "natureEvidence": [
            _rate(counts["nature"] + counts["waterfall"], candidate["distanceMeters"])
            for counts, candidate in zip(feature_counts, candidates, strict=True)
        ],
        "viewpointEvidence": [
            _rate(counts["viewpoint"], candidate["distanceMeters"])
            for counts, candidate in zip(feature_counts, candidates, strict=True)
        ],
        "beachEvidence": [
            _rate(counts["beach"], candidate["distanceMeters"])
            for counts, candidate in zip(feature_counts, candidates, strict=True)
        ],
        "wildlifeEvidence": [
            _rate(counts["wildlife"], candidate["distanceMeters"])
            for counts, candidate in zip(feature_counts, candidates, strict=True)
        ],
        "parkEvidence": [
            _rate(counts["park"], candidate["distanceMeters"])
            for counts, candidate in zip(feature_counts, candidates, strict=True)
        ],
        "foodEvidence": [
            _rate(counts["food"], candidate["distanceMeters"])
            for counts, candidate in zip(feature_counts, candidates, strict=True)
        ],
        "heritageEvidence": [
            _rate(counts["heritage"], candidate["distanceMeters"])
            for counts, candidate in zip(feature_counts, candidates, strict=True)
        ],
        "museumEvidence": [
            _rate(counts["museum"], candidate["distanceMeters"])
            for counts, candidate in zip(feature_counts, candidates, strict=True)
        ],
        "cultureReligiousEvidence": [
            _rate(counts["cultureReligious"], candidate["distanceMeters"])
            for counts, candidate in zip(feature_counts, candidates, strict=True)
        ],
        "hiddenGemEvidence": [
            _rate(sum("hidden-gem" in poi["tags"] for poi in candidate["nearbyPois"]), candidate["distanceMeters"])
            for candidate in candidates
        ],
    }
    normalized = {key: normalized_component(values) for key, values in feature_specs.items()}

    if preference == "fastest":
        supported = True
        weights = {"duration": 1.0}
        components = [{"duration": 1 - penalty} for penalty in duration_norm]
    elif preference == "hidden-gems":
        supported = any(
            "hidden-gem" in poi["tags"]
            for candidate in candidates
            for poi in candidate["nearbyPois"]
        )
        weights = SCORING_WEIGHTS[preference]
        components = []
        for index in range(len(candidates)):
            components.append({
                "hiddenGemEvidence": normalized["hiddenGemEvidence"][index],
                "durationPenalty": duration_norm[index],
                "distancePenalty": distance_norm[index],
            })
    else:
        weights = SCORING_WEIGHTS[preference]
        if preference == "nature":
            feature_keys = ["natureEvidence", "wildlifeEvidence", "parkEvidence"]
        elif preference == "scenic":
            feature_keys = ["natureEvidence", "viewpointEvidence", "beachEvidence", "wildlifeEvidence", "parkEvidence"]
        elif preference == "food":
            feature_keys = ["foodEvidence"]
        else:
            feature_keys = ["heritageEvidence", "museumEvidence", "cultureReligiousEvidence"]
        def has_evidence(candidate: dict[str, Any], key: str) -> bool:
            counts = candidate["categoryCounts"]
            category = {
                "natureEvidence": counts["nature"] + counts["waterfall"],
                "viewpointEvidence": counts["viewpoint"],
                "beachEvidence": counts["beach"],
                "wildlifeEvidence": counts["wildlife"],
                "parkEvidence": counts["park"],
                "foodEvidence": counts["food"],
                "heritageEvidence": counts["heritage"],
                "museumEvidence": counts["museum"],
                "cultureReligiousEvidence": counts["cultureReligious"],
            }[key]
            return category > 0

        supported = any(has_evidence(candidate, key) for candidate in candidates for key in feature_keys)
        components = []
        for index in range(len(candidates)):
            component: dict[str, float] = {}
            for key, weight in weights.items():
                if key == "durationPenalty":
                    component[key] = duration_norm[index]
                elif key == "distancePenalty":
                    component[key] = distance_norm[index]
                else:
                    component[key] = normalized[key][index]
            components.append(component)

    fallback = not supported and preference != "fastest"
    for index, candidate in enumerate(candidates):
        if fallback:
            candidate["score"] = None
            candidate["scoreBreakdown"] = {}
        else:
            contribution_weights = weights
            if preference == "fastest":
                score = components[index]["duration"]
                candidate["scoreBreakdown"] = {
                    "durationNormalized": round(duration_norm[index], 4),
                    "durationContribution": round(score, 4),
                    "weight": 1.0,
                }
            else:
                score = 0.0
                breakdown: dict[str, float] = {}
                for key, weight in contribution_weights.items():
                    raw = components[index][key]
                    contribution = (1 - raw if key in {"durationPenalty", "distancePenalty"} else raw) * weight
                    score += contribution
                    breakdown[f"{key}Normalized"] = round(raw, 4)
                    breakdown[f"{key}Contribution"] = round(contribution, 4)
                    breakdown[f"{key}Weight"] = weight
                candidate["scoreBreakdown"] = breakdown
            candidate["score"] = round(max(0.0, min(1.0, score)), 4)
    fastest = min(candidates, key=lambda item: (item["durationSeconds"], item["distanceMeters"]))
    for candidate in candidates:
        candidate["detourFromFastestMeters"] = round(max(0.0, candidate["distanceMeters"] - fastest["distanceMeters"]), 1)
        candidate["detourFromFastestSeconds"] = round(max(0.0, candidate["durationSeconds"] - fastest["durationSeconds"]), 1)
        candidate["recommended"] = False
        candidate["recommendationReason"] = ""

    if fallback:
        winner = min(candidates, key=lambda candidate: (candidate["durationSeconds"], candidate["distanceMeters"], candidate["candidateId"]))
        reason = (
            f"The {preference} preference is unsupported because no route corridor has source-backed "
            "evidence for it; the fastest OSRM candidate is recommended as a fallback."
        )
        recommendation_method = "fastest_fallback"
    else:
        winner = min(candidates, key=lambda candidate: (-float(candidate["score"]), candidate["durationSeconds"], candidate["candidateId"]))
        if preference == "fastest":
            reason = "Recommended by the shortest OSRM duration among the valid candidates."
        else:
            evidence = ", ".join(
                f"{key}={winner['categoryCounts'][category]}"
                for key, category in (
                    ("nature", "nature"), ("viewpoints", "viewpoint"), ("beaches", "beach"),
                    ("wildlife", "wildlife"), ("heritage", "heritage"), ("museums", "museum"),
                    ("food", "food"),
                )
                if winner["categoryCounts"].get(category, 0) > 0
            )
            reason = (
                f"Highest transparent {preference} feature score ({winner['score']:.2f}); "
                f"measured nearby POI evidence: {evidence or 'category evidence tied'}, "
                f"duration {winner['durationSeconds'] / 60:.0f} minutes."
            )
        recommendation_method = "preference_score"
    winner["recommended"] = True
    winner["recommendationReason"] = reason
    for candidate in candidates:
        if candidate is not winner:
            if fallback:
                candidate["recommendationReason"] = "Preference unsupported; ranked below the fastest fallback candidate."
            else:
                candidate["recommendationReason"] = (
                    f"Preference score {candidate['score']:.2f}; recommended candidate scored {winner['score']:.2f}."
                )

    return candidates, supported, recommendation_method, reason


class RouteEngine:
    def __init__(
        self,
        pois: list[dict[str, Any]],
        osrm: OSRMClient | None = None,
        corridor_meters: float = DEFAULT_CORRIDOR_METERS,
        max_candidates: int = MAX_CANDIDATES_DEFAULT,
    ) -> None:
        self.pois = normalize_pois(pois)
        self.osrm = osrm or OSRMClient()
        self.corridor_meters = corridor_meters
        self.max_candidates = max_candidates
        if not 1 <= max_candidates <= 5:
            raise RouteEngineError("max_candidates must be between 1 and 5.")

    def plan(self, request: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(request, dict):
            raise RouteEngineError("Input must be a JSON object.")
        origin = parse_coordinate(request.get("origin"), "origin")
        destination = parse_coordinate(request.get("destination"), "destination")
        preference = request.get("preference", "fastest")
        if not isinstance(preference, str):
            raise RouteEngineError("preference must be a string.")
        preference = preference.strip().lower()

        candidates, generation_warnings = route_candidates(
            origin, destination, self.pois, self.osrm, self.max_candidates
        )
        candidates = route_poi_features(candidates, self.pois, self.corridor_meters)
        candidates, supported, recommendation_method, reason = add_preference_scores(candidates, preference)
        recommended = next((candidate for candidate in candidates if candidate["recommended"]), None)
        return {
            "success": True,
            "preference": preference,
            "preferenceSupported": supported,
            "recommendationMethod": recommendation_method,
            "recommendedCandidateId": recommended["candidateId"] if recommended else None,
            "recommendationReason": reason,
            "corridorMeters": self.corridor_meters,
            "candidateCount": len(candidates),
            "generationWarnings": generation_warnings,
            "scoringWeights": SCORING_WEIGHTS.get(preference, {"duration": 1.0} if preference == "fastest" else {}),
            "candidates": candidates,
        }


def read_json_input() -> dict[str, Any]:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError as error:
        raise RouteEngineError(f"Input is not valid JSON: {error}") from error
    if not isinstance(payload, dict):
        raise RouteEngineError("Input JSON must be an object.")
    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate and score real OSRM road-trip alternatives.")
    parser.add_argument("--pois-file", help="Use an exported POI JSON file instead of the existing POI API.")
    parser.add_argument(
        "--pois-url",
        default=os.environ.get("VIATOR_POI_API_URL", "http://localhost:5000/api/v1/pois"),
        help="Existing VIATOR POI API URL (default: %(default)s).",
    )
    parser.add_argument(
        "--osrm-url",
        default=os.environ.get("OSRM_BASE_URL", "https://router.project-osrm.org"),
        help="OSRM base URL (default: %(default)s).",
    )
    parser.add_argument("--corridor-meters", type=float, default=DEFAULT_CORRIDOR_METERS)
    parser.add_argument("--max-candidates", type=int, default=MAX_CANDIDATES_DEFAULT)
    args = parser.parse_args()

    try:
        request = read_json_input()
        pois = POILoader(args.pois_url).load(args.pois_file)
        engine = RouteEngine(
            pois,
            osrm=OSRMClient(args.osrm_url),
            corridor_meters=args.corridor_meters,
            max_candidates=args.max_candidates,
        )
        # ASCII escaping keeps the JSON pipe reliable with Windows console encodings.
        print(json.dumps(engine.plan(request), ensure_ascii=True, allow_nan=False))
        return 0
    except RouteEngineError as error:
        print(json.dumps({"success": False, "error": str(error)}, ensure_ascii=False), file=sys.stdout)
        return 1
    except Exception as error:  # Keep the CLI contract machine-readable on unexpected upstream/library faults.
        print(json.dumps({"success": False, "error": f"Unexpected route engine error: {error}"}, ensure_ascii=False), file=sys.stdout)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
