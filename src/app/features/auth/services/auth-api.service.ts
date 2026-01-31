/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  async login(
    _username: string,
    _password: string,
  ): Promise<{ success: boolean }> {
    // Placeholder for real API call
    return Promise.resolve({ success: true });
  }

  async register(
    _username: string,
    _password: string,
  ): Promise<{ success: boolean }> {
    return Promise.resolve({ success: true });
  }

  async forgotPassword(_email: string): Promise<{ success: boolean }> {
    return Promise.resolve({ success: true });
  }
}
