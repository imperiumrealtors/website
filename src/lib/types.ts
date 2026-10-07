export type PropertyType = 'Plot' | 'Apartment' | 'Villa' | 'Commercial';

export type Facing =
  | 'North' | 'South' | 'East' | 'West'
  | 'North-East' | 'North-West' | 'South-East' | 'South-West';
export const FACINGS: Facing[] = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];

export type Approval = 'DTCP' | 'RERA' | 'CMDA' | 'Panchayat';

export type LandUse = 'Residential' | 'Commercial' | 'Farmland' | 'Industrial';

export interface Property {
  id: string;
  slug: string;
  title: string;
  projectName: string;
  builder: string;
  type: PropertyType;
  price: number; // in lakhs
  priceLabel: string;
  area: number; // sq ft
  location: string;
  corridor: string;
  city: string;
  address: string;
  coordinates: { lat: number; lng: number };
  status: 'Ready to Register' | 'Development in Progress' | 'New Launch';
  possession: string;
  description: string;
  highlights: string[];
  infrastructure: Infrastructure[];
  photos: string[];
  videoUrl?: string;
  nearbyPlaces: NearbyPlace[];
  priceBreakdown: PriceItem[];
  featured: boolean;
  newLaunch: boolean;
  createdAt: string;
  land?: LandDetails;
  bhk?: number | null;
  floorPlans?: FloorPlan[];
}

export interface LandDetails {
  use: LandUse;
  approvals: Approval[];
  approvalId: string;
  pricePerSqft: number;
  totalPlots: number;
  availablePlots: number;
  roadWidth: string;
  facingOptions: Facing[];
  appreciation: string;
  soil: string;
  waterSource: string;
  loanEligible: boolean;
  gatedCommunity: boolean;
  units: PlotUnit[];
  documents: LandDocument[];
}

export interface PlotUnit {
  id: string;
  number: string;
  area: number;
  dimensions: string;
  facing: Facing;
  corner: boolean;
  price: number;
  priceLabel: string;
  availability: 'Available' | 'On Hold' | 'Sold';
}

export interface LandDocument {
  name: string;
  detail: string;
  verified: boolean;
}

export interface Infrastructure {
  id: string;
  name: string;
  icon: string;
  category: 'Approvals' | 'Roads & Utilities' | 'Community' | 'Security';
}

export interface NearbyPlace {
  name: string;
  type: 'Metro' | 'School' | 'Hospital' | 'IT Park' | 'Airport' | 'Mall' | 'Highway' | 'Beach' | 'Park';
  distance: string;
  duration: string;
}

export interface PriceItem {
  label: string;
  amount: string;
}

export interface Corridor {
  id: string;
  name: string;
  slug: string;
  blurb: string;
  image: string;
  startingPrice: string;
  appreciation: string;
  drivers: string[];
}

export interface Layout {
  id: string;
  name: string;
  builder: string;
  location: string;
  category: PropertyType;
  status: 'Development in Progress' | 'Fully Sold' | 'New Launch';
  totalPlots: number;
  landArea: string;
  startingPrice: string;
  completionDate: string;
  description: string;
  coverImage: string;
  features: string[];
}

/* ===== Admin / CRM domain ===== */

export type Role = 'admin' | 'manager' | 'sales' | 'customer';

export type PlotStatus = 'Available' | 'Reserved' | 'Sold' | 'Blocked';
export const PLOT_STATUSES: PlotStatus[] = ['Available', 'Reserved', 'Sold', 'Blocked'];

export type LeadStatus =
  | 'New' | 'Contacted' | 'Follow-up' | 'Site Visit Scheduled' | 'Negotiation' | 'Converted' | 'Lost';
export const LEAD_STATUSES: LeadStatus[] = [
  'New', 'Contacted', 'Follow-up', 'Site Visit Scheduled', 'Negotiation', 'Converted', 'Lost',
];

export type VisitStatus = 'Requested' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rescheduled';
export const VISIT_STATUSES: VisitStatus[] = ['Requested', 'Confirmed', 'Completed', 'Cancelled', 'Rescheduled'];

export type MediaKind = 'image' | 'video' | 'brochure' | 'document';
export const MEDIA_KINDS: MediaKind[] = ['image', 'video', 'brochure', 'document'];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface LayoutRecord {
  id: string;
  slug: string;
  name: string;
  builder: string;
  location: string;
  corridor: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  status: Property['status'];
  possession: string;
  description: string;
  priceLakhs: number;
  priceLabel: string;
  pricePerSqft: number;
  landArea: string;
  landUse: LandUse;
  approvals: Approval[];
  approvalId: string;
  roadWidth: string;
  facingOptions: Facing[];
  appreciation: string;
  soil: string;
  waterSource: string;
  loanEligible: boolean;
  gated: boolean;
  highlights: string[];
  infrastructure: string[];
  photos: string[];
  videoUrl: string | null;
  nearby: NearbyPlace[];
  priceBreakdown: PriceItem[];
  documents: LandDocument[];
  featured: boolean;
  newLaunch: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlotRecord {
  id: string;
  layoutId: string;
  layoutName?: string;
  number: string;
  area: number;
  dimensions: string;
  facing: Facing;
  corner: boolean;
  priceLakhs: number;
  priceLabel: string;
  status: PlotStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  layoutId: string | null;
  layoutName?: string | null;
  plotId: string | null;
  plotNumber?: string | null;
  budget: string;
  source: string;
  status: LeadStatus;
  assignedTo: string | null;
  assignedName?: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteVisit {
  id: string;
  leadId: string | null;
  customerName: string;
  phone: string;
  layoutId: string | null;
  layoutName?: string | null;
  preferredDate: string;
  preferredTime: string;
  visitors: number;
  pickup: boolean;
  assignedTo: string | null;
  assignedName?: string | null;
  status: VisitStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  layoutId: string | null;
  layoutName?: string | null;
  kind: MediaKind;
  title: string;
  fileName: string;
  mime: string;
  size: number;
  isPublic: boolean;
  uploadedBy: string | null;
  createdAt: string;
  url: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  userName?: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown>;
  ip: string | null;
  createdAt: string;
}

export interface FloorPlan {
  id: string;
  bhk: number;
  area: number;
  price: number;
  priceLabel: string;
  imageUrl: string;
  description: string;
}
