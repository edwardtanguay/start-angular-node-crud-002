import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { FormsModule } from "@angular/forms";
import { Employee } from "./models/employee";
import { EmployeeService } from "./services/employee.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit {
  employees: Employee[] = [];
  displayedEmployees: Employee[] = [];
  searchTerm = "";
  sortField: keyof Employee = "fullName";
  sortDirection: "asc" | "desc" = "asc";
  loading = false;
  saving = false;
  errorMessage = "";
  formVisible = false;
  editingEmployee: Employee | null = null;

  readonly columns: Array<{ key: keyof Employee; label: string; grow?: string }> =
    [
      { key: "id", label: "ID", grow: "w-16" },
      { key: "fullName", label: "Name", grow: "min-w-[160px]" },
      { key: "role", label: "Role", grow: "min-w-[160px]" },
      { key: "department", label: "Dept.", grow: "min-w-[120px]" },
      { key: "email", label: "Email", grow: "min-w-[200px]" },
      { key: "salary", label: "Salary", grow: "min-w-[120px]" },
      { key: "hireDate", label: "Hire Date", grow: "min-w-[140px]" },
    ];

  readonly employeeForm = this.fb.nonNullable.group({
    fullName: ["", [Validators.required, Validators.minLength(3)]],
    role: ["", Validators.required],
    department: ["", Validators.required],
    email: ["", [Validators.required, Validators.email]],
    salary: [90000, [Validators.required, Validators.min(0)]],
    hireDate: ["", Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.fetchEmployees();
  }

  fetchEmployees(): void {
    this.loading = true;
    this.employeeService.getAll().subscribe({
      next: (employees) => {
        this.employees = employees;
        this.applyFilters();
        this.errorMessage = "";
      },
      error: () => {
        this.errorMessage =
          "We could not load employees. Please ensure the server is running.";
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    let result = [...this.employees];
    if (term) {
      result = result.filter((employee) => {
        return Object.values(employee)
          .join(" ")
          .toLowerCase()
          .includes(term);
      });
    }

    result.sort((a, b) => {
      const field = this.sortField;
      const dir = this.sortDirection === "asc" ? 1 : -1;
      const aValue = a[field];
      const bValue = b[field];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * dir;
      }
      return String(aValue).localeCompare(String(bValue)) * dir;
    });

    this.displayedEmployees = result;
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  sortBy(field: keyof Employee): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortField = field;
      this.sortDirection = "asc";
    }
    this.applyFilters();
  }

  flipSortDirection(): void {
    this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    this.applyFilters();
  }

  openCreateForm(): void {
    this.formVisible = true;
    this.editingEmployee = null;
    this.employeeForm.reset({
      fullName: "",
      role: "",
      department: "",
      email: "",
      salary: 90000,
      hireDate: new Date().toISOString().slice(0, 10),
    });
  }

  openEditForm(employee: Employee): void {
    this.formVisible = true;
    this.editingEmployee = employee;
    this.employeeForm.patchValue(employee);
  }

  closeForm(): void {
    this.formVisible = false;
    this.employeeForm.reset();
    this.editingEmployee = null;
    this.saving = false;
  }

  submitForm(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const formValue = this.employeeForm.getRawValue();
    const payload = {
      fullName: formValue.fullName.trim(),
      role: formValue.role.trim(),
      department: formValue.department.trim(),
      email: formValue.email.trim(),
      salary: Number(formValue.salary),
      hireDate: formValue.hireDate,
    };

    this.saving = true;

    if (this.editingEmployee) {
      const updatedEmployee: Employee = {
        ...this.editingEmployee,
        ...payload,
      };
      this.employeeService.update(updatedEmployee).subscribe({
        next: (employee) => {
          this.employees = this.employees.map((existing) =>
            existing.id === employee.id ? employee : existing
          );
          this.applyFilters();
          this.closeForm();
        },
        error: () => {
          this.errorMessage = "Unable to update employee right now.";
          this.saving = false;
        },
        complete: () => (this.saving = false),
      });
    } else {
      this.employeeService.create(payload).subscribe({
        next: (employee) => {
          this.employees = [...this.employees, employee];
          this.applyFilters();
          this.closeForm();
        },
        error: () => {
          this.errorMessage = "Unable to create employee right now.";
          this.saving = false;
        },
        complete: () => (this.saving = false),
      });
    }
  }

  deleteEmployee(employee: Employee): void {
    const confirmed = confirm(
      `Delete ${employee.fullName}? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    this.employeeService.delete(employee.id).subscribe({
      next: () => {
        this.employees = this.employees.filter((item) => item.id !== employee.id);
        this.applyFilters();
      },
      error: () => {
        this.errorMessage = "Unable to delete employee right now.";
      },
    });
  }

  trackById(_: number, employee: Employee): number {
    return employee.id;
  }
}
