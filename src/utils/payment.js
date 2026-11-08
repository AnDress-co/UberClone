import { colors } from '../config/theme';

export function paymentStatusKey(trip) {
    switch (trip?.paymentStatus) {
        case 'cash': return 'pay.cash';
        case 'approved': return 'pay.approved';
        case 'rejected': return 'pay.rejected';
        default: return 'pay.pending';
    }
}

export const paymentStatusColor = (trip) =>
    ({ 'pay.cash': colors.accent, 'pay.approved': colors.accent, 'pay.rejected': colors.danger, 'pay.pending': colors.warning }[paymentStatusKey(trip)]);
