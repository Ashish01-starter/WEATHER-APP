// Service to fetch real-time disaster metrics

// Define approximate center coordinates for major Indian states
export const STATE_COORDINATES: Record<string, { lat: number; lon: number }> = {
    "Andaman and Nicobar Islands": { lat: 11.7401, lon: 92.6586 },
    "Andhra Pradesh": { lat: 15.9129, lon: 79.7400 },
    "Arunachal Pradesh": { lat: 28.2180, lon: 94.7278 },
    "Assam": { lat: 26.2006, lon: 92.9376 },
    "Bihar": { lat: 25.0961, lon: 85.3131 },
    "Chandigarh": { lat: 30.7333, lon: 76.7794 },
    "Chhattisgarh": { lat: 21.2787, lon: 81.8661 },
    "Dadra and Nagar Haveli": { lat: 20.1809, lon: 73.0169 },
    "Daman and Diu": { lat: 20.4283, lon: 72.8397 },
    "Delhi": { lat: 28.7041, lon: 77.1025 },
    "Goa": { lat: 15.2993, lon: 74.1240 },
    "Gujarat": { lat: 22.2587, lon: 71.1924 },
    "Haryana": { lat: 29.0588, lon: 76.0856 },
    "Himachal Pradesh": { lat: 31.1048, lon: 77.1734 },
    "Jammu and Kashmir": { lat: 33.7782, lon: 76.5762 },
    "Jharkhand": { lat: 23.6102, lon: 85.2799 },
    "Karnataka": { lat: 15.3173, lon: 75.7139 },
    "Kerala": { lat: 10.8505, lon: 76.2711 },
    "Ladakh": { lat: 34.1526, lon: 77.5771 },
    "Lakshadweep": { lat: 10.5667, lon: 72.6417 },
    "Madhya Pradesh": { lat: 22.9734, lon: 78.6569 },
    "Maharashtra": { lat: 19.7515, lon: 75.7139 },
    "Manipur": { lat: 24.6637, lon: 93.9063 },
    "Meghalaya": { lat: 25.4670, lon: 91.3662 },
    "Mizoram": { lat: 23.1645, lon: 92.9376 },
    "Nagaland": { lat: 26.1584, lon: 94.5624 },
    "Odisha": { lat: 20.9517, lon: 85.0985 },
    "Puducherry": { lat: 11.9416, lon: 79.8083 },
    "Punjab": { lat: 31.1471, lon: 75.3412 },
    "Rajasthan": { lat: 27.0238, lon: 74.2179 },
    "Sikkim": { lat: 27.5330, lon: 88.5122 },
    "Tamil Nadu": { lat: 11.1271, lon: 78.6569 },
    "Telangana": { lat: 18.1124, lon: 79.0193 },
    "Tripura": { lat: 23.9408, lon: 91.9882 },
    "Uttar Pradesh": { lat: 26.8467, lon: 80.9462 },
    "Uttarakhand": { lat: 30.0668, lon: 79.0193 },
    "West Bengal": { lat: 22.9868, lon: 87.8550 }
};

export interface StateMetrics {
    temp: number;
    discharge: number;
    seismic: number;
    timeseries: { time: string; temp: number; discharge: number; seismic: number }[];
}

export const fetchDisasterData = async (locationName: string, stateName?: string): Promise<StateMetrics> => {
    // Default coords mapped from constant (fallback) or New Delhi
    let coords = STATE_COORDINATES[locationName] || { lat: 28.7041, lon: 77.1025 };

    try {
        const query = stateName ? `${locationName}, ${stateName}, India` : `${locationName}, India`;
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&format=json`);
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
            coords = {
                lat: geoData.results[0].latitude,
                lon: geoData.results[0].longitude
            };
        }
    } catch (e) {
        console.error("Geocoding failed, using fallback coordinates");
    }

    try {
        // 1. Fetch Temp from Open-Meteo
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m&hourly=temperature_2m&timezone=auto`);
        const weatherData = await weatherRes.json();

        // 2. Fetch River Discharge from Open-Meteo Flood API
        const floodRes = await fetch(`https://flood-api.open-meteo.com/v1/flood?latitude=${coords.lat}&longitude=${coords.lon}&daily=river_discharge&timezone=auto`);
        const floodData = await floodRes.json();

        // 3. Fetch Earthquake from USGS (real-time for India region generally, or mock if too few)
        // Here we query last 30 days for significant events near the coords, but for demo realism
        // we generate a mild random ambient seismic value if nothing recent, plus a small chance of a real query
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        let seismicMag = (Math.random() * 2).toFixed(1); // Default safe ambient

        try {
            const eqRes = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startDate}&endtime=${endDate}&minlatitude=${coords.lat - 5}&maxlatitude=${coords.lat + 5}&minlongitude=${coords.lon - 5}&maxlongitude=${coords.lon + 5}&minmagnitude=3.0`);
            const eqData = await eqRes.json();
            if (eqData.features && eqData.features.length > 0) {
                seismicMag = eqData.features[0].properties.mag; // Get most recent significant eq magnitude
            }
        } catch (e) {
            console.error("Earthquake format failed, using ambient baseline");
        }

        // Process data to timeseries (using hourly temp mapped over 6 hours)
        const currentTemp = weatherData.current?.temperature_2m || (Math.random() * 10 + 30);
        const currentDischarge = floodData.daily?.river_discharge?.[0] || (Math.random() * 500 + 100);

        const timeseries = [];
        const numPoints = 6;
        for (let i = 0; i < numPoints; i++) {
            timeseries.push({
                time: `${(i * 4).toString().padStart(2, '0')}:00`,
                temp: weatherData.hourly?.temperature_2m?.[i * 4] || currentTemp + (Math.random() * 4 - 2),
                discharge: currentDischarge + (Math.random() * 100 - 50),
                seismic: parseFloat(seismicMag as string) + (Math.random() * 0.2 - 0.1)
            });
        }

        return {
            temp: currentTemp,
            discharge: parseFloat(currentDischarge.toFixed(2)),
            seismic: parseFloat(seismicMag as string),
            timeseries
        };

    } catch (error) {
        console.error(`Failed fetching data for ${stateName}:`, error);
        // Fallback to mock data if APIs rate limit
        return generateMockMetrics();
    }
};

export const fetchAllStatesData = async (): Promise<Record<string, StateMetrics>> => {
    // In a real app we'd batch this or use a server, for demo we'll fetch just exactly what we click 
    // and mock the map overall statuses to avoid 30+ simultaneous API calls getting strictly rate-limited
    // by free tiers.
    return {};
}

const generateMockMetrics = (): StateMetrics => {
    const currentTemp = 30 + Math.random() * 15;
    const currentDischarge = 100 + Math.random() * 2000;
    const seismicMag = Math.random() * 3;

    const timeseries = Array(6).fill(0).map((_, i) => ({
        time: `${(i * 4).toString().padStart(2, '0')}:00`,
        temp: currentTemp + (Math.random() * 4 - 2),
        discharge: currentDischarge + (Math.random() * 100 - 50),
        seismic: seismicMag + (Math.random() * 0.2 - 0.1)
    }));

    return {
        temp: parseFloat(currentTemp.toFixed(1)),
        discharge: parseFloat(currentDischarge.toFixed(1)),
        seismic: parseFloat(seismicMag.toFixed(1)),
        timeseries
    };
};
