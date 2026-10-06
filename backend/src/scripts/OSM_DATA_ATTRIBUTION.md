# Kerala POI import attribution

`seedKeralaPois.ts` imports selected Kerala geographic features from OpenStreetMap through the Overpass API. This includes named objects tagged `amenity=restaurant` or `amenity=cafe`; their OSM amenity and any present cuisine tag are retained as POI tags. Food records are limited to 100 newly imported records per seed run, in addition to the existing 300-record cap for other imported POIs. Imported records use deterministic IDs beginning with `POI_osm_`; those IDs retain the OSM element type and source ID. New imported ratings and review counts start at zero, and images remain empty. Existing records with the same deterministic OSM ID retain their actual rating, review count, and images.

OpenStreetMap data is available under the Open Data Commons Open Database License (ODbL). Credit OpenStreetMap contributors and link to [openstreetmap.org/copyright](https://www.openstreetmap.org/copyright) wherever this imported data is presented or redistributed. The ODbL includes share-alike obligations for derivative databases; review those obligations before distributing this combined POI database.

Source: [OpenStreetMap](https://www.openstreetmap.org/), queried through [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API).
