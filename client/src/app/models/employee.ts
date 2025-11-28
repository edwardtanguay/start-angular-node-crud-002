export interface Employee {
  id: number;
  fullName: string;
  role: string;
  department: string;
  email: string;
  salary: number;
  hireDate: string;
}

export type EmployeePayload = Omit<Employee, "id">;

