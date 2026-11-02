const fs = require('fs');

module.exports = ({ config }) => {
  const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  return {
    ...config,
    name: 'UberClone Conductor',
    slug: config.slug || 'uberclone-conductor',
    scheme: 'uberclone-conductor',
    ios: {
      ...config.ios,
      bundleIdentifier: 'co.edu.tdea.uberclone.conductor',
      config: { googleMapsApiKey: mapsKey },
    },
    android: {
      ...config.android,
      package: 'co.edu.tdea.uberclone.conductor',
      config: { googleMaps: { apiKey: mapsKey } },      
      ...(fs.existsSync('./google-services.json') ? { googleServicesFile: './google-services.json' } : {}),
    },
    plugins: [
      ...(config.plugins || []),
      ['expo-location', { locationWhenInUsePermission: 'Necesitamos tu ubicación para recibir solicitudes de viaje cercanas.' }],
      ['expo-image-picker', { cameraPermission: 'Necesitamos la cámara para tus fotos y documentos.', photosPermission: 'Necesitamos tus fotos para adjuntar documentos.' }],
      'expo-notifications',
    ],
  };
};