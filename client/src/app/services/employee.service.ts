import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Employee, EmployeePayload } from "../models/employee";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class EmployeeService {
  private readonly baseUrl = `${environment.apiUrl}/employees`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.baseUrl);
  }

  create(payload: EmployeePayload): Observable<Employee> {
    return this.http.post<Employee>(this.baseUrl, payload);
  }

  update(employee: Employee): Observable<Employee> {
    return this.http.put<Employee>(`${this.baseUrl}/${employee.id}`, employee);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

