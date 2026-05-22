const SEAT_LABEL_RE = /^[A-H](10|[1-9])$/;

export const normalizeSeatList = (seats: unknown): string[] | null => {
  if (!Array.isArray(seats) || seats.length === 0) return null;

  const normalizedSeats = seats.map((seat: unknown) => String(seat).trim().toUpperCase());
  const uniqueSeats = [...new Set(normalizedSeats)];

  if (uniqueSeats.length !== normalizedSeats.length) return null;
  if (uniqueSeats.some((seat) => !SEAT_LABEL_RE.test(seat))) return null;

  return uniqueSeats;
};

export interface ProductDraft {
  name?: unknown;
  price?: unknown;
}

export const isValidProductDraft = (data: ProductDraft): boolean => {
  if (typeof data.name !== 'string' || data.name.trim().length === 0) return false;

  const price = Number(data.price);
  return Number.isFinite(price) && price > 0;
};

export const canFinalizeApprovedPayment = (status?: string | null): boolean =>
  status !== 'approved';

export const canRejectPendingPayment = (status?: string | null): boolean =>
  status === 'pending';
