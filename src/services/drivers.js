import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { PRICING } from '../config/pricing';
import { normalizePlate } from '../utils/validators';

export function buildDriverDocument(f, urls) {
    return {
        personal: {
            fullName: f.fullName.trim(),
            documentId: f.documentId.trim(),
            phone: f.phone.trim(),
            birthDate: f.birthDate,
            gender: f.gender,
            email: f.email.trim(),
            language: f.language,
            photoUrl: urls.photo,
        },
        vehicle: {
            category: f.category,
            plate: normalizePlate(f.plate),
            brand: f.brand.trim(),
            model: f.model.trim(),
            year: Number(f.year),
            color: f.color,
            capacity: Number(f.capacity),
            photoUrl: urls.vehiclePhoto,
        },
        documents: {
            license: { number: f.licenseNumber.trim(), photoUrl: urls.licensePhoto, expiry: f.licenseExpiry },
            soat: { photoUrl: urls.soatPhoto, expiry: f.soatExpiry },
            tech: urls.techPhoto ? { photoUrl: urls.techPhoto, expiry: f.techExpiry } : null,
        },

        payout: { mercadoPagoEmail: f.mpEmail.trim() },
        termsAccepted: true,
        acceptedCommissionRate: PRICING.commissionRate,
        approvalStatus: 'pending',
        available: false,
        createdAt: serverTimestamp(),
    };
}

export const createDriverProfile = (uid, data) => setDoc(doc(db, 'drivers', uid), data);

export const setAvailability = (uid, available) =>
    updateDoc(doc(db, 'drivers', uid), { available, availabilityUpdatedAt: serverTimestamp() });

export const updateDriverLocation = (uid, c) =>
    updateDoc(doc(db, 'drivers', uid), {
        location: { lat: c.lat, lng: c.lng, heading: c.heading ?? null, updatedAt: serverTimestamp() },
    });

export const updateDriverPersonal = (uid, { fullName, phone, email }) =>
    updateDoc(doc(db, 'drivers', uid), {
        'personal.fullName': fullName.trim(),
        'personal.phone': phone.trim(),
        'personal.email': email.trim(),
    });

export const updateDriverLanguage = (uid, language) => updateDoc(doc(db, 'drivers', uid), { 'personal.language': language });
export const saveFcmToken = (uid, fcmToken) => updateDoc(doc(db, 'drivers', uid), { fcmToken });
