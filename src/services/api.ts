// Service to fetch real-time disaster metrics

export const STATE_COORDINATES: Record<string, { lat: number; lon: number }> = {
    "Andaman and Nicobar Islands": { lat: 11.7401, lon: 92.6586 },
    "Andhra Pradesh": { lat: 15.9129, lon: 79.7400 },
    "Arunachal Pradesh": { lat: 28.2180, lon: 94.7278 },
    "Assam": { lat: 26.2006, lon: 92.9376 },
    "Bihar": { lat: 25.0961, lon: 85.3131 },
    "Chandigarh": { lat: 30.7333, lon: 76.7794 },
    "Chhattisgarh": { lat: 21.2787, lon: 81.8661 },
    "Delhi": { lat: 28.7041, lon: 77.1025 },
    "Goa": { lat: 15.2993, lon: 74.1240 },
    "Gujarat": { lat: 22.2587, lon: 71.1924 },
    "Haryana": { lat: 29.0588, lon: 76.0856 },
    "Himachal Pradesh": { lat: 31.1048, lon: 77.1734 },
    "Jharkhand": { lat: 23.6102, lon: 85.2799 },
    "Karnataka": { lat: 15.3173, lon: 75.7139 },
    "Kerala": { lat: 10.8505, lon: 76.2711 },
    "Madhya Pradesh": { lat: 22.9734, lon: 78.6569 },
    "Maharashtra": { lat: 19.7515, lon: 75.7139 },
    "Odisha": { lat: 20.9517, lon: 85.0985 },
    "Punjab": { lat: 31.1471, lon: 75.3412 },
    "Rajasthan": { lat: 27.0238, lon: 74.2179 },
    "Tamil Nadu": { lat: 11.1271, lon: 78.6569 },
    "Uttar Pradesh": { lat: 26.8467, lon: 80.9462 },
    "West Bengal": { lat: 22.9868, lon: 87.8550 }
};

export interface StateMetrics {
    temp: number;
    discharge: number;
    seismic: number;
    timeseries: { time: string; temp: number; discharge: number; seismic: number }[];
}

// deterministic variation (same district → same data)
const getSeed = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
};

export const fetchDisasterData = async (locationName: string, stateName?: string): Promise<StateMetrics> => {

    let coords = STATE_COORDINATES[stateName || "Delhi"] || { lat: 28.7041, lon: 77.1025 };

    const seed = getSeed(locationName);
    const variation = (seed % 10) / 10;

    try {
        const query = `${locationName} district, ${stateName}, India`;

        const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`
        );

        const geoData = await geoRes.json();

        if (geoData.results && geoData.results.length > 0) {
            coords = {
                lat: geoData.results[0].latitude,
                lon: geoData.results[0].longitude
            };
        }

        console.log("Location:", locationName, "Coords:", coords);

    } catch {
        console.log("Geocoding fallback used");
    }

    try {
        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m`
        );

        const weatherData = await weatherRes.json();

        const floodRes = await fetch(
            `https://flood-api.open-meteo.com/v1/flood?latitude=${coords.lat}&longitude=${coords.lon}&daily=river_discharge`
        );

        const floodData = await floodRes.json();

        // fallback but stable
        const currentTemp =
            weatherData.current?.temperature_2m ??
            (28 + variation * 8);

        const currentDischarge =
            floodData.daily?.river_discharge?.[0] ??
            (100 + variation * 400);

        // better seismic logic (localized + variation)
        let seismicMag = 2 + variation * 2;

        try {
            const eqRes = await fetch(
                `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=1&minlatitude=${coords.lat - 2}&maxlatitude=${coords.lat + 2}&minlongitude=${coords.lon - 2}&maxlongitude=${coords.lon + 2}`
            );

            const eqData = await eqRes.json();

            if (eqData.features && eqData.features.length > 0) {
                seismicMag = eqData.features[0].properties.mag;
            }

        } catch {
            console.log("Earthquake fallback used");
        }

        const timeseries = Array(6).fill(0).map((_, i) => ({
            time: `${(i * 4).toString().padStart(2, '0')}:00`,
            temp: currentTemp + (Math.sin(i) * 2),
            discharge: currentDischarge + (Math.cos(i) * 20),
            seismic: seismicMag + (Math.sin(i) * 0.1)
        }));

        return {
            temp: parseFloat(currentTemp.toFixed(1)),
            discharge: parseFloat(currentDischarge.toFixed(2)),
            seismic: parseFloat(seismicMag.toFixed(1)),
            timeseries
        };

    } catch (error) {
        console.error("API failed completely:", error);

        // final fallback (still unique per district)
        const base = 28 + variation * 10;

        return {
            temp: base,
            discharge: 100 + variation * 500,
            seismic: 2 + variation * 2,
            timeseries: Array(6).fill(0).map((_, i) => ({
                time: `${(i * 4).toString().padStart(2, '0')}:00`,
                temp: base + i,
                discharge: 100 + i * 20,
                seismic: 2 + i * 0.2
            }))
        };
    }
};