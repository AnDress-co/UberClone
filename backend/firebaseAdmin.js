const fs = require('node:fs');
const path = require('node:path');
const { applicationDefault, cert, getApps, initializeApp } = require('firebase-admin/app');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

function readServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (error) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT_JSON no es un JSON válido: ${error.message}`);
    }
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) return null;

  const absolutePath = path.resolve(credentialsPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`No existe el archivo de credenciales: ${absolutePath}`);
  }

  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

const serviceAccount = readServiceAccount();
const app = getApps().length
  ? getApps()[0]
  : initializeApp(
      serviceAccount
        ? { credential: cert(serviceAccount) }
        : { credential: applicationDefault() }
    );

const db = getFirestore(app);
const auth = getAuth(app);

module.exports = { FieldValue, auth, db };
