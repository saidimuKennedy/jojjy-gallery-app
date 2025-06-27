import {
  Artwork as PrismaArtwork,
  Transaction as PrismaTransaction,
  User as PrismaUser,
  Series as PrismaSeries,
} from "@prisma/client";

export interface APIError {
  message: string;
  status?: number;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
}

export interface Series extends Omit<PrismaSeries, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
}

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
    | "seriesId"
    | "inGallery"
  > {
  price: number;
  createdAt: string;
  updatedAt: string;
  description: string | null;
  dimensions: string | null;
  year: number | null;
  medium: string | null;
  isAvailable: boolean | null;
  inGallery: boolean;
}

export interface Transaction
  extends Omit<
    PrismaTransaction,
    "amount" | "timestamp" | "createdAt" | "updatedAt"
  > {
  amount: number;
  timestamp: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User extends Omit<PrismaUser, "createdAt" | "updatedAt"> {
  createdAt?: string;
  updatedAt?: string;
}

export interface ArtworkWithRelations extends Artwork {
  transactions?: Transaction[];
  series?: Series | null;
}

export interface ArtworkWithFullRelations extends Artwork {
  transactions?: (Transaction & {
    user?: User;
  })[];
  series?: Series | null;
}

export type ArtworkResponse = APIResponse<ArtworkWithRelations>;
export type ArtworksResponse = APIResponse<ArtworkWithRelations[]>;
export type ArtworkWithFullRelationsResponse =
  APIResponse<ArtworkWithFullRelations>;

export interface SeriesWithArtworks extends Series {
  artworks: Artwork[];
}
export type SeriesResponse = APIResponse<SeriesWithArtworks>;
export type SeriesListResponse = APIResponse<Series[]>;

export interface ArtworkFilters {
  category?: string;
  price?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  artist?: string;
  medium?: string;
  year?: number;
  isAvailable?: boolean;
  seriesId?: number;
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

export function convertPrismaSeriesToAPI(series: PrismaSeries): Series {
  return {
    ...series,
    createdAt: series.createdAt.toISOString(),
    updatedAt: series.updatedAt.toISOString(),
  };
}

export function convertPrismaArtworkToAPI(artwork: PrismaArtwork): Artwork {
  return {
    ...artwork,
    price: artwork.price.toNumber(),
    createdAt: artwork.createdAt.toISOString(),
    updatedAt: artwork.updatedAt.toISOString(),
  };
}

export function convertPrismaTransactionToAPI(
  transaction: PrismaTransaction
): Transaction {
  return {
    ...transaction,
    amount: transaction.amount.toNumber(),
    timestamp: transaction.timestamp.toISOString(),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

export function convertPrismaUserToAPI(user: PrismaUser): User {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function convertPrismaArtworkWithRelationsToAPI(
  artwork: PrismaArtwork & {
    transactions?: PrismaTransaction[];
    series?: PrismaSeries | null;
  }
): ArtworkWithRelations {
  return {
    ...convertPrismaArtworkToAPI(artwork),
    transactions: artwork.transactions?.map(convertPrismaTransactionToAPI),
    series: artwork.series ? convertPrismaSeriesToAPI(artwork.series) : null,
  };
}

export function convertPrismaSeriesWithArtworksToAPI(
  series: PrismaSeries & { artworks?: PrismaArtwork[] }
): SeriesWithArtworks {
  return {
    ...convertPrismaSeriesToAPI(series),
    artworks: series.artworks
      ? series.artworks.map(convertPrismaArtworkToAPI)
      : [],
  };
}

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

export interface UseSeriesReturn {
  series: SeriesWithArtworks | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: string | undefined;
  mutate: () => void;
}

export interface UseSeriesListReturn {
  seriesList: Series[];
  isLoading: boolean;
  isValidating: boolean;
  error: string | undefined;
  mutate: () => void;
}
