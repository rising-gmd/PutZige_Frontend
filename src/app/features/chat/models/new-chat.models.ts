export interface SearchUsersRequest {
  query: string;
  pageNumber?: number;
  pageSize?: number;
  excludeCurrentUser?: boolean;
}

export interface SearchUsersResponse {
  users: UserSearchResult[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

// UserSearchResult moved to `user.model.ts` to avoid duplicate domain types.
export type UserSearchResult = import('./user.model').UserSearchResult;

export interface RecentContactsResponse {
  contacts: UserSearchResult[];
  lastUpdated: string | Date;
}

export interface SuggestedUsersResponse {
  suggestions: UserSearchResult[];
  reason: 'mutual_contacts' | 'same_organization' | 'frequent_interaction';
}
