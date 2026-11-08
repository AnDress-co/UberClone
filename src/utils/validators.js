import { PRICING, XL_MIN_CAPACITY } from '../config/pricing.js';
import { ageOn, isAfterToday } from './dates.js';

const NAME_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PLATE_RE = /^[A-Z]{3}\d{3}$/;

export const isEmpty = (v) => v === undefined || v === null || String(v).trim() === '';
export const normalizePlate = (v) => String(v || '').trim().toUpperCase();
export const validateEmail = (v) => (isEmpty(v) ? 'err.required' : EMAIL_RE.test(v.trim()) ? null : 'err.email');

export function needsTechReview(year, now = new Date()) {
  const y = Number(year);
  return Number.isInteger(y) && now.getFullYear() - y >= PRICING.techReviewAfterYears;
}

export function validatePersonal(f, now = new Date()) {
  const e = {};
  if (isEmpty(f.photo)) e.photo = 'err.required';

  const name = (f.fullName || '').trim();
  if (!name) e.fullName = 'err.required';
  else if (name.length > 50) e.fullName = 'err.max50';
  else if (!NAME_RE.test(name)) e.fullName = 'err.nameLetters';

  if (isEmpty(f.documentId)) e.documentId = 'err.required';
  else if (!/^\d{6,10}$/.test(f.documentId.trim())) e.documentId = 'err.document';

  if (isEmpty(f.phone)) e.phone = 'err.required';
  else if (!/^\d{10}$/.test(f.phone.trim())) e.phone = 'err.phone';

  if (isEmpty(f.birthDate)) e.birthDate = 'err.required';
  else if (ageOn(f.birthDate, now) < 18) e.birthDate = 'err.age';

  if (isEmpty(f.gender)) e.gender = 'err.required';
  const mail = validateEmail(f.email || '');
  if (mail) e.email = mail;
  if (isEmpty(f.language)) e.language = 'err.required';
  return e;
}

export function validateVehicle(f, now = new Date()) {
  const e = {};
  if (isEmpty(f.category)) e.category = 'err.required';

  const plate = normalizePlate(f.plate);
  if (!plate) e.plate = 'err.required';
  else if (!PLATE_RE.test(plate)) e.plate = 'err.plate';

  for (const k of ['brand', 'model']) {
    const v = (f[k] || '').trim();
    if (!v) e[k] = 'err.required';
    else if (v.length > 30) e[k] = 'err.max30';
  }

  if (isEmpty(f.year)) e.year = 'err.required';
  else if (!/^\d{4}$/.test(f.year.trim())) e.year = 'err.year';
  else if (Number(f.year) > now.getFullYear()) e.year = 'err.yearFuture';

  if (isEmpty(f.color)) e.color = 'err.required';

  if (isEmpty(f.capacity)) e.capacity = 'err.required';
  else if (!/^\d+$/.test(f.capacity.trim()) || Number(f.capacity) < 1) e.capacity = 'err.numeric';
  else if (f.category === 'xl' && Number(f.capacity) < XL_MIN_CAPACITY) e.capacity = 'err.xlCapacity';

  if (isEmpty(f.vehiclePhoto)) e.vehiclePhoto = 'err.required';
  return e;
}

export function validateDocuments(f, now = new Date()) {
  const e = {};
  if (isEmpty(f.licenseNumber)) e.licenseNumber = 'err.required';
  else if (!/^\d{5,10}$/.test(f.licenseNumber.trim())) e.licenseNumber = 'err.numeric';
  if (isEmpty(f.licensePhoto)) e.licensePhoto = 'err.required';

  const expiry = (key) => {
    if (isEmpty(f[key])) e[key] = 'err.required';
    else if (!isAfterToday(f[key], now)) e[key] = 'err.expired';
  };
  expiry('licenseExpiry');
  if (isEmpty(f.soatPhoto)) e.soatPhoto = 'err.required';
  expiry('soatExpiry');

  if (needsTechReview(f.year, now)) {
    if (isEmpty(f.techPhoto)) e.techPhoto = 'err.required';
    expiry('techExpiry');
  }

  const mail = validateEmail(f.mpEmail || '');
  if (mail) e.mpEmail = mail;
  if (!f.acceptTerms) e.acceptTerms = 'err.terms';
  return e;
}

export function validateProfileEdit(f) {
  const e = {};
  const name = (f.fullName || '').trim();
  if (!name) e.fullName = 'err.required';
  else if (name.length > 50) e.fullName = 'err.max50';
  else if (!NAME_RE.test(name)) e.fullName = 'err.nameLetters';
  if (isEmpty(f.phone)) e.phone = 'err.required';
  else if (!/^\d{10}$/.test(f.phone.trim())) e.phone = 'err.phone';
  const mail = validateEmail(f.email || '');
  if (mail) e.email = mail;
  return e;
}
