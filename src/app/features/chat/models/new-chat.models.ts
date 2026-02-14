export interface SearchUsersRequest {
  query: string;
  pageNumber?: number;
  pageSize?: number;
  excludeCurrentUser?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors: string[] | null;
  responseCode: string;
  statusCode: number;
  timestamp: string;
}

export interface SearchUsersData {
  users: UserSearchResult[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export type SearchUsersResponse = ApiResponse<SearchUsersData>;

// UserSearchResult moved to `user.model.ts` to avoid duplicate domain types.
export type UserSearchResult = import('./user.model').UserSearchResult;

export interface RecentContactsData {
  contacts: UserSearchResult[];
  lastUpdated: string | Date;
}

export type RecentContactsResponse = ApiResponse<RecentContactsData>;

export interface SuggestedUsersData {
  suggestions: UserSearchResult[];
  reason: 'mutual_contacts' | 'same_organization' | 'frequent_interaction';
}

export type SuggestedUsersResponse = ApiResponse<SuggestedUsersData>;
