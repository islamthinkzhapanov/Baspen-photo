export interface Photo {
  id: string;
  eventId: string;
  albumId: string | null;
  uploadedBy: string;
  storagePath: string;
  thumbnailPath: string | null;
  thumbnailAvifPath: string | null;
  watermarkedPath: string | null;
  placeholder: string | null;
  originalFilename: string | null;
  mimeType: string | null;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  exifData: unknown;
  status: string;
  bibNumbers: string[] | null;
  sortOrder: number;
  createdAt: string;
  publicPath?: string;
}

export interface PhotosResponse {
  photos: Photo[];
  total: number;
  page: number;
  limit: number;
}

export interface Event {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  description: string | null;
  date: string | null;
  eventTime: string | null;
  eventEndTime: string | null;
  location: string | null;
  coverUrl: string | null;
  cover?: string | null;
  pricingMode: string;
  branding: {
    logo?: string;
    primaryColor?: string;
    bannerUrl?: string;
  } | null;
  settings: {
    freeDownload?: boolean;
    watermarkEnabled?: boolean;
    watermarkText?: string;
    watermarkOpacity?: number;
    pricePerPhoto?: number;
    packageDiscount?: number;
    commissionPercent?: number;
    bibSearchEnabled?: boolean;
    faceSearchEnabled?: boolean;
    displayMode?: "search" | "gallery";
    retentionMonths?: number;
  } | null;
  geofence: {
    lat: number;
    lng: number;
    radiusKm: number;
  } | null;
  isPublished: boolean;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
  searches?: number;
  participants?: number;
  revenue?: number;
  downloads?: number;
  currentUserRole?: string;
}

export interface Album {
  id: string;
  eventId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  photoCount?: number;
}

export interface Sponsor {
  id: string;
  eventId: string;
  name: string;
  logoUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface Order {
  id: string;
  eventId: string;
  participantId: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  downloadToken: string;
  downloadExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  eventTitle?: string;
  eventSlug?: string;
  photoCount?: number;
  isPackage?: boolean;
  paymentProvider?: string;
}

export interface EventMember {
  id: string;
  eventId: string;
  userId: string;
  role: string;
  invitedAt: string;
  acceptedAt: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface SearchPhoto {
  id: string;
  thumbnail_path: string | null;
  thumbnail_avif_path: string | null;
  watermarked_path: string | null;
  placeholder: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
  similarity?: number;
  album_id?: string | null;
  albumId?: string | null;
}

export interface FaceSearchResult {
  photos: SearchPhoto[];
  sessionToken: string;
  total: number;
  error?: string;
}

export interface NumberSearchResult {
  photos: SearchPhoto[];
  total: number;
}

export interface EventPricing {
  pricePerPhoto: number;
  packageDiscount: number;
  freeDownload: boolean;
  packageEligible?: boolean;
  packageTotal?: number;
}

export interface EventAnalytics {
  searches: number;
  participants: number;
  revenue: number;
  photoCount: number;
  orders: number;
  totalPhotos: number;
  totalParticipants: number;
  totalMatches: number;
  totalOrders: number;
  totalRevenue: number;
  searchBreakdown: {
    face: number;
    number: number;
  };
  revenueByDay: { date: string; revenue: number }[];
  chartData: { date: string; value: number }[];
  popularPhotos: {
    photoId: string;
    thumbnailPath: string | null;
    purchaseCount: number;
  }[];
}
