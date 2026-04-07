export interface CreateCategoryData {
  name: string;
  description?: string;
  slug?: string;
  displayOrder?: number;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  slug?: string;
  displayOrder?: number;
}

export interface CategoryFilters {
  isActive?: boolean;
  search?: string;
}
