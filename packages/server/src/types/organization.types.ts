export interface CreateOrganizationData {
  name: string;
  description: string;
  contactEmail: string;
  locationRegion: string;
  locationCity: string;
  websiteUrl?: string;
}

export interface UpdateOrganizationData {
  name?: string;
  description?: string;
  contactEmail?: string;
  locationRegion?: string;
  locationCity?: string;
  websiteUrl?: string;
}

export interface SearchOrganizationsFilters {
  region?: string;
  city?: string;
  status?: string;
  search?: string;
}
