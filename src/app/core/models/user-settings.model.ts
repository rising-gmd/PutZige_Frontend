import { UI_CONSTANTS } from '../constants/ui.constants';
const { DEFAULT_TIMEZONE } = UI_CONSTANTS;

/**
 * User settings shape returned by backend and used client-side.
 */
export interface UserSettings {
  readonly timeZoneId: string;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  timeZoneId: DEFAULT_TIMEZONE as string,
};

/**
 * DTOs for user preferences API
 */
export interface UserPreferencesDto {
  timeZoneId: string;
  theme: string;
  isDarkMode: boolean;
  language: string;
}

export interface UserPreferencesPatchDto {
  timeZoneId?: string;
  theme?: string;
  isDarkMode?: boolean;
  language?: string;
}

export interface UpdatePreferencesRequest {
  preferences: UserPreferencesPatchDto;
}
