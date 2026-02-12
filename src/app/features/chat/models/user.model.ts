/**
 * User domain model used at runtime.
 */
export interface User {
  /** Unique identifier */
  readonly id: string;
  /** Username / handle */
  readonly username: string;
  /** Email address */
  readonly email: string;
  /** Display name shown in UI */
  readonly displayName: string;
  /** Optional job title */
  readonly jobTitle?: string;
  /** Optional short bio */
  readonly bio?: string;
  /** Optional avatar url */
  readonly profilePictureUrl?: string;
  /** Online presence flag */
  readonly isOnline: boolean;
  /** Last seen timestamp (runtime Date) */
  readonly lastSeen?: Date;
}

/**
 * Lightweight presence update from realtime transport
 */
export interface UserStatus {
  readonly userId: string;
  readonly isOnline: boolean;
  readonly lastSeen?: Date;
}

/**
 * Lightweight user shape used for search results and discovery APIs.
 * Display name and some fields may be optional from the search API.
 */
export interface UserSearchResult {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  profilePictureUrl?: string;
  isOnline: boolean;
  lastSeen?: string | Date;
  bio?: string;
  jobTitle?: string;
}
