import { HttpClient, HttpParamsOptions } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Auth } from '../../pages/authorization/authorization.component';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

// private apiUrl = 'https://localhost:7173/';
  private apiUrl = 'https://192.168.1.15:7174/';
  constructor(private http:HttpClient)
  {
  }
  Login(obj: Auth): Observable<any> {
    return this.http.get<any>(this.apiUrl + `ControlPanel/login-to-shop?gmail=${obj.gmail}&password=${obj.password}`, );
  }
}

 