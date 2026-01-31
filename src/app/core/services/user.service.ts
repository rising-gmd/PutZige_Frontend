import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api.config';

export interface User {
  id: string;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getUsers(): Observable<User[]> {
    // Use relative endpoint; interceptor will prepend the configured base URL.
    return this.http.get<User[]>(API_ENDPOINTS.USERS.LIST);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(API_ENDPOINTS.USERS.DETAIL(id));
  }
}
