import { ENV } from '../config/env';

const BASE = 'https://maps.googleapis.com/maps/api';
const pt = (p) => `${p.lat},${p.lng}`;

export async function getDistanceMatrix(origin, destination) {
    const url = `${BASE}/distancematrix/json?origins=${pt(origin)}&destinations=${pt(destination)}&mode=driving&key=${ENV.googleMapsKey}`;
    const data = await (await fetch(url)).json();
    const el = data.rows?.[0]?.elements?.[0];
    if (data.status !== 'OK' || el?.status !== 'OK') throw new Error('DISTANCE_MATRIX_FAILED');
    return {
        distanceKm: Math.round(el.distance.value / 100) / 10,
        durationMin: Math.round(el.duration.value / 60),
    };
}

export async function getRoute(origin, destination) {
    const url = `${BASE}/directions/json?origin=${pt(origin)}&destination=${pt(destination)}&mode=driving&key=${ENV.googleMapsKey}`;
    const data = await (await fetch(url)).json();
    const route = data.routes?.[0];
    if (data.status !== 'OK' || !route) throw new Error('DIRECTIONS_FAILED');
    return { encoded: route.overview_polyline.points };
}