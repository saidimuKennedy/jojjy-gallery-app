import {
  Artwork as PrismaArtwork,
  Transaction as PrismaTransaction,
  User as PrismaUser,
} from "@prisma/client";

// ============================================================================
// BASE ERROR TYPES
// ============================================================================
export interface APIError {
  message: string;
  status?: number;
}

// ============================================================================
// GENERIC API RESPONSE WRAPPER
// ============================================================================
export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number; // For paginated responses
}

// ============================================================================
// TRANSFORMED ARTWORK TYPES (Prisma -> API)
// ============================================================================

// Convert Prisma Decimal to number for API responses
export interface Artwork
  extends Omit<
    PrismaArtwork,
    | "price"
    | "createdAt"
    | "updatedAt"
    | "description"
    | "dimensions"
    | "year"
    | "medium"
    | "isAvailable"
    | "featured"
  > {
  price: number; // Convert Decimal to number
  createdAt: string; // Convert DateTime to ISO string (optional for responses)
  updatedAt: string; // Convert DateTime to ISO string (optional for responses)
  // Explicitly define properties that might be `null` in Prisma and you want to reflect that
  description: string | null; // From Prisma: string | null
  dimensions: string | null; // From Prisma: string | null
  year: number | null; // From Prisma: number | null (assuming year can be null)
  medium: string | null; // From Prisma: string | null (assuming medium can be null)
  isAvailable: boolean | null; // From Prisma: boolean | null (assuming isAvailable can be null)
  featured: boolean | null; // From Prisma: boolean (assuming featured is always defined)
}

export interface Transaction
  extends Omit<
    PrismaTransaction,
    "amount" | "timestamp" | "createdAt" | "updatedAt"
  > {
  amount: number; // Convert Decimal to number
  timestamp: string; // Convert DateTime to ISO string
  createdAt?: string; // Convert DateTime to ISO string (optional for responses)
  updatedAt?: string; // Convert DateTime to ISO string (optional for responses)
}

// User type (mostly unchanged, just DateTime conversion)
export interface User extends Omit<PrismaUser, "createdAt" | "updatedAt"> {
  createdAt?: string; // Convert DateTime to ISO string (optional for responses)
  updatedAt?: string; // Convert DateTime to ISO string (optional for responses)
}

// ============================================================================
// ARTWORK WITH RELATIONS
// ============================================================================
export interface ArtworkWithRelations extends Artwork {
  transactions?: Transaction[];
}

export interface ArtworkWithFullRelations extends Artwork {
  transactions?: (Transaction & {
    user?: User;
  })[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================
export type ArtworkResponse = APIResponse<ArtworkWithRelations>;
export type ArtworksResponse = APIResponse<ArtworkWithRelations[]>;
export type ArtworkWithFullRelationsResponse =
  APIResponse<ArtworkWithFullRelations>;

// ============================================================================
// FILTER TYPES
// ============================================================================
export interface ArtworkFilters {
  category?: string;
  price?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  artist?: string;
  medium?: string;
  year?: number;
  featured?: boolean;
  isAvailable?: boolean;
  sort?:
    | "price_asc"
    | "price_desc"
    | "name_asc"
    | "name_desc"
    | "year_asc"
    | "year_desc"
    | "views_asc"
    | "views_desc";
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================
export interface PaymentSuccessData {
  transactionId: string;
  artworkIds: number[];
  status: "completed";
  amount: number;
  phoneNumber: string;
  timestamp: string;
}

export interface PaymentResponse {
  success: boolean;
  message?: string;
  data?: PaymentSuccessData;
  error?: string;
}

export interface PaymentErrorData {
  success: boolean;
  message: string;
  error?: string;
}

export interface CartPaymentRequestData {
  phoneNumber: string;
  artworkIds: number[];
}
// ============================================================================
// TYPE CONVERSION UTILITIES
// ============================================================================

/**
 * Convert Prisma Artwork to API Artwork
 */
export function convertPrismaArtworkToAPI(artwork: PrismaArtwork): Artwork {
  return {
    ...artwork,
    price: artwork.price.toNumber(), // Convert Decimal to number
    createdAt: artwork.createdAt.toISOString(),
    updatedAt: artwork.updatedAt.toISOString(),
  };
}

/**
 * Convert Prisma Transaction to API Transaction
 */
export function convertPrismaTransactionToAPI(
  transaction: PrismaTransaction
): Transaction {
  return {
    ...transaction,
    amount: transaction.amount.toNumber(), // Convert Decimal to number
    timestamp: transaction.timestamp.toISOString(),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

/**
 * Convert Prisma User to API User
 */
export function convertPrismaUserToAPI(user: PrismaUser): User {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/**
 * Convert Prisma Artwork with relations to API format
 */
export function convertPrismaArtworkWithRelationsToAPI(
  artwork: PrismaArtwork & { transactions?: PrismaTransaction[] }
): ArtworkWithRelations {
  return {
    ...convertPrismaArtworkToAPI(artwork),
    transactions: artwork.transactions?.map(convertPrismaTransactionToAPI),
  };
}

// ============================================================================
// SWR HOOK TYPES
// ============================================================================
export interface UseArtworksReturn {
  artworks: ArtworkWithRelations[];
  total: number;
  isLoading: boolean;
  isValidating: boolean;
  error: string | undefined;
  mutate: () => void;
}

export interface UseArtworkReturn {
  artwork: ArtworkWithRelations | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: string | undefined;
  mutate: () => void;
}
