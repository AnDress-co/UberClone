require('dotenv').config();
const { createTrip } = require('../services/tripService');

const SCENARIOS = {
  'economy-cash': {
    category: 'economy',
    passengerName: 'Paula Sánchez',
    passengerRating: 5,
    tip: 1000,
    origin: { address: 'Universidad Nacional - Medellín', lat: 6.2698, lng: -75.5681 },
    destination: { address: 'Jardín Botánico de Medellín', lat: 6.2706, lng: -75.5658 },
    distanceKm: 3.8,
    durationMin: 14,
    paymentMethod: 'cash',
  },
  'economy-mercadopago': {
    category: 'economy',
    passengerName: 'Diego Restrepo',
    origin: { address: 'Pueblito Paisa', lat: 6.2377, lng: -75.5817 },
    destination: { address: 'Parque de los Deseos', lat: 6.2697, lng: -75.5657 },
    distanceKm: 7.6,
    durationMin: 24,
    paymentMethod: 'mercadopago',
  },
  'economy-mercadopago-2': {
    category: 'economy',
    passengerName: 'Valentina Mejía',
    passengerRating: 4.8,
    tip: 2000,
    origin: { address: 'Estadio Atanasio Girardot', lat: 6.2562, lng: -75.5905 },
    destination: { address: 'Museo de Antioquia', lat: 6.2518, lng: -75.5681 },
    distanceKm: 6.1,
    durationMin: 20,
    paymentMethod: 'mercadopago',
  },
  'short-economy-cash': {
    category: 'economy',
    passengerName: 'Laura Gómez',
    origin: { address: 'Universidad de Medellín', lat: 6.2317, lng: -75.6034 },
    destination: { address: 'Parque Lleras', lat: 6.2088, lng: -75.5673 },
    distanceKm: 8.5,
    durationMin: 22,
    paymentMethod: 'cash',
  },
  'airport-xl-cash': {
    category: 'xl',
    passengerName: 'Carlos Ramírez',
    origin: { address: 'Aeropuerto José María Córdova', lat: 6.1645, lng: -75.4231 },
    destination: { address: 'Centro Comercial Santa Fe', lat: 6.1968, lng: -75.5748 },
    distanceKm: 28,
    durationMin: 48,
    paymentMethod: 'cash',
  },
  'premium-city': {
    category: 'premium',
    passengerName: 'Mariana Torres',
    origin: { address: 'Laureles', lat: 6.2442, lng: -75.5998 },
    destination: { address: 'El Tesoro', lat: 6.1952, lng: -75.5603 },
    distanceKm: 12.4,
    durationMin: 30,
    paymentMethod: 'mercadopago',
  },
  'online-economy': {
    category: 'economy',
    passengerName: 'Andrés López',
    origin: { address: 'Plaza Botero', lat: 6.2518, lng: -75.5681 },
    destination: { address: 'Unidad Deportiva Atanasio Girardot', lat: 6.2562, lng: -75.5905 },
    distanceKm: 5.2,
    durationMin: 18,
    paymentMethod: 'mercadopago',
  },
  'long-premium': {
    category: 'premium',
    passengerName: 'Sofía Martínez',
    origin: { address: 'Envigado Centro', lat: 6.1719, lng: -75.5849 },
    destination: { address: 'Aeropuerto José María Córdova', lat: 6.1645, lng: -75.4231 },
    distanceKm: 31,
    durationMin: 55,
    paymentMethod: 'cash',
  },
};

function getArgument(name) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : null;
}

async function createScenario(name) {
  const trip = await createTrip(SCENARIOS[name]);
  console.log(`\nViaje creado: ${name}`);
  console.log(`  ID: ${trip.id}`);
  console.log(`  Categoría: ${trip.category}`);
  console.log(`  Estado: ${trip.status}`);
  console.log(`  Pago: ${trip.paymentMethod}`);
  console.log(`  Tarifa: ${trip.fare} ${trip.currency}`);
}

async function main() {
  if (process.argv.includes('--list')) {
    console.log('Escenarios disponibles:');
    Object.keys(SCENARIOS).forEach((name) => console.log(`- ${name}`));
    return;
  }

  const requested = getArgument('scenario');
  const names = requested ? [requested] : Object.keys(SCENARIOS);

  for (const name of names) {
    if (!SCENARIOS[name]) {
      throw new Error(`Escenario desconocido: ${name}. Usa --list para ver las opciones.`);
    }
    await createScenario(name);
  }
}

main().catch((error) => {
  console.error('\nNo se pudieron crear los viajes de demostración:', error.message);
  process.exitCode = 1;
});
