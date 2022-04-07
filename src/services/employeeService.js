import dayjs from "dayjs";
import { employeeRepository } from "../repositories/employeeRepository.js";
import { HTTPError } from "../utils/httpUtils.js";

function formatEmployee(employee) {
  const birthDate = dayjs(employee.birthDate).format("DD/MM/YYYY");
  const dateJoined = dayjs(employee.dateJoined).format("DD/MM/YYYY");
  return { ...employee, birthDate, dateJoined };
}

function getINSSRate(grossSalary) {
  let rate = 7.5;
  if (grossSalary > 121200 && grossSalary < 242735) {
    rate = 9;
  } else if (grossSalary > 242736 && grossSalary < 364103) {
    rate = 12;
  } else if (grossSalary > 364104) {
    rate = 14;
  }

  return rate;
}

function deductINSSFromSalary(grossSalary) {
  const rate = getINSSRate(grossSalary);

  const deduction = grossSalary * (rate / 100);
  const deductedSalary = grossSalary - deduction;

  return { rate, deduction, deductedSalary };
}

function getIRRFRate(INSSDeductedSalary) {
  let rate = null;
  if (INSSDeductedSalary > 190399 && INSSDeductedSalary < 282665) {
    rate = 7.5;
  } else if (INSSDeductedSalary > 282666 && INSSDeductedSalary < 375105) {
    rate = 15;
  } else if (INSSDeductedSalary > 375106 && INSSDeductedSalary < 466468) {
    rate = 22.5;
  } else if (INSSDeductedSalary > 466469) {
    rate = 27.5;
  }

  return rate;
}

function deductIRRFFromSalary(INSSDeductedSalary) {
  const rate = getIRRFRate(INSSDeductedSalary);

  const deduction = rate ? INSSDeductedSalary * (rate / 100) : 0;

  const deductedSalary = INSSDeductedSalary - deduction;

  return { rate, deduction, deductedSalary };
}

async function findAll() {
  const employees = await employeeRepository.findAll();

  return employees.map((employee) => formatEmployee(employee));
}

async function findById(id) {
  const employee = await employeeRepository.findById(id);
  if (!employee) throw HTTPError("Employee not found", 404);

  return formatEmployee(employee);
}

async function getNetSalaryWithTaxes(id) {
  const employee = await findById(id);

  const { grossSalary } = employee;
  const INSS = deductINSSFromSalary(grossSalary);
  const IRRF = deductIRRFFromSalary(INSS.deductedSalary);
  const netSalary = IRRF.deductedSalary;

  return {
    grossSalary,
    netSalary,
    INSS,
    IRRF,
  };
}

async function insert(employee) {
  const salaryInCents = employee.grossSalary * 100;
  await employeeRepository.insert({
    ...employee,
    grossSalary: salaryInCents,
  });
}

async function update(id, payload) {
  const employee = await findById(id);

  const newEmployee = { ...employee, ...payload };
  if (payload.grossSalary) {
    newEmployee.grossSalary = payload.grossSalary * 100;
  }

  await employeeRepository.update(id, newEmployee);
}

async function remove(id) {
  await employeeRepository.remove(id);
}

export const employeeService = {
  findAll,
  findById,
  getNetSalaryWithTaxes,
  insert,
  update,
  remove,
};