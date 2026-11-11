import { ENV } from '../config/env';

const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

const point = (value, name) => {
    const latitude = Number(value?.lat);
    const longitude = Number(value?.lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error(`${name}_COORDINATES_INVALID`);
    }

    return {
        location: {
            latLng: { latitude, longitude },
        },
    };
};

async function computeRoute(origin, destination) {
    const response = await fetch(ROUTES_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': ENV.googleMapsKey,
            'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify({
            origin: point(origin, 'ORIGIN'),
            destination: point(destination, 'DESTINATION'),
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE',
            computeAlternativeRoutes: false,
            languageCode: 'es',
            units: 'METRIC',
        }),
    });

    const data = await response.json().catch(() => ({}));
    const route = data.routes?.[0];

    if (!response.ok || !route?.polyline?.encodedPolyline) {
        const apiMessage = data.error?.message || data.error?.status || response.status;
        throw new Error(`ROUTES_API_FAILED_${apiMessage}`);
    }

    return route;
}

export async function getDistanceMatrix(origin, destination) {
    const route = await computeRoute(origin, destination);
    const durationSeconds = Number.parseFloat(String(route.duration || '').replace('s', ''));

    if (!Number.isFinite(route.distanceMeters) || !Number.isFinite(durationSeconds)) {
        throw new Error('ROUTES_API_METRICS_INVALID');
    }

    return {
        distanceKm: Math.round((route.distanceMeters / 1000) * 10) / 10,
        durationMin: Math.round(durationSeconds / 60),
    };
}

export async function getRoute(origin, destination) {
    const route = await computeRoute(origin, destination);
    return { encoded: route.polyline.encodedPolyline };
}
