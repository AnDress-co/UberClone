require('dotenv').config();
const { createTrip } = require('../services/tripService');

createTrip({
  category: process.env.SEED_CATEGORY || 'economy',
  passengerName: process.env.SEED_PASSENGER_NAME || 'Pasajero de prueba',
  pickup: process.env.SEED_PICKUP || 'Universidad de Medellin',
  destination: process.env.SEED_DESTINATION || 'Parque Lleras',
  distanceKm: Number(process.env.SEED_DISTANCE_KM || 8.5),
  durationMin: Number(process.env.SEED_DURATION_MIN || 22),
  paymentMethod: process.env.SEED_PAYMENT_METHOD || 'cash',
})
  .then((trip) => {
    console.log(`Viaje creado: ${trip.id}`);
    console.log(`Categoría: ${trip.category} | Tarifa: ${trip.fare} ${trip.currency}`);
  })
  .catch((error) => {
    console.error('No se pudo crear el viaje:', error.message);
    process.exitCode = 1;
  });
