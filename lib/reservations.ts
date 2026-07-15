import prisma from "@/lib/prisma";
import { RESERVATION_HOLD_HOURS } from "@/lib/reservation-constants";

export { RESERVATION_HOLD_HOURS };

/**
 * Releases any RESERVED artworks whose hold has expired, flipping them back
 * to AVAILABLE. There's no cron runner in this repo, so this is called
 * lazily from the read/checkout paths that would otherwise show or sell a
 * stale reservation.
 */
export async function releaseExpiredReservations(artworkId?: number) {
  await prisma.artwork.updateMany({
    where: {
      status: "RESERVED",
      reservedUntil: { lt: new Date() },
      ...(artworkId !== undefined ? { id: artworkId } : {}),
    },
    data: {
      status: "AVAILABLE",
      reservedUntil: null,
      reservedByUserId: null,
    },
  });
}
