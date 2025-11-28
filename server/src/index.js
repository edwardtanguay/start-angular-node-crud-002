import express from "express";
import cors from "cors";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, "../data/employees.json");

app.use(cors());
app.use(express.json());

async function ensureDataFile() {
  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify([], null, 2));
  }
}

async function readEmployees() {
  await ensureDataFile();
  const data = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(data);
}

async function writeEmployees(employees) {
  await fs.writeFile(DATA_PATH, JSON.stringify(employees, null, 2));
}

app.get("/api/employees", async (req, res) => {
  try {
    const employees = await readEmployees();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Failed to read employees", error });
  }
});

app.post("/api/employees", async (req, res) => {
  try {
    const employees = await readEmployees();
    const payload = req.body ?? {};
    const nextId =
      employees.reduce((max, emp) => Math.max(max, emp.id ?? 0), 0) + 1;
    const newEmployee = {
      id: nextId,
      fullName: payload.fullName?.trim() ?? "",
      role: payload.role?.trim() ?? "",
      department: payload.department?.trim() ?? "",
      email: payload.email?.trim() ?? "",
      salary: Number(payload.salary) || 0,
      hireDate: payload.hireDate ?? new Date().toISOString().slice(0, 10),
    };
    employees.push(newEmployee);
    await writeEmployees(employees);
    res.status(201).json(newEmployee);
  } catch (error) {
    res.status(500).json({ message: "Failed to create employee", error });
  }
});

app.put("/api/employees/:id", async (req, res) => {
  try {
    const employees = await readEmployees();
    const idx = employees.findIndex(
      (emp) => String(emp.id) === String(req.params.id)
    );
    if (idx === -1) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const payload = req.body ?? {};
    const allowedKeys = [
      "fullName",
      "role",
      "department",
      "email",
      "salary",
      "hireDate",
    ];
    const updatedEmployee = { ...employees[idx] };
    for (const key of allowedKeys) {
      if (payload[key] !== undefined) {
        updatedEmployee[key] =
          key === "salary" ? Number(payload[key]) || 0 : payload[key];
      }
    }
    employees[idx] = updatedEmployee;
    await writeEmployees(employees);
    res.json(employees[idx]);
  } catch (error) {
    res.status(500).json({ message: "Failed to update employee", error });
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  try {
    const employees = await readEmployees();
    const remaining = employees.filter(
      (emp) => String(emp.id) !== String(req.params.id)
    );

    if (remaining.length === employees.length) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await writeEmployees(remaining);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete employee", error });
  }
});

app.use((_, res) => {
  res.status(404).json({ message: "Route not found" });
});

ensureDataFile().then(() => {
  app.listen(PORT, () => {
    console.log(`Employee API ready on http://localhost:${PORT}`);
  });
});

