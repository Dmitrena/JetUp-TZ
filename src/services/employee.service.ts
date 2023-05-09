import cheerio from 'cheerio';
import { Request, Response } from 'express';
import pool from '../db/db';
import { IEmployee, IEmployeeRow } from '../types/employee.interface';

export async function saveEmployees(employees: IEmployee[]) {
  for (const employee of employees) {
    const { firstName, position, description } = employee;
    try {
      const existingEmployee = await pool.query(
        'SELECT * FROM employee WHERE first_name = $1 AND position = $2 AND description = $3',
        [firstName, position, description]
      );
      if (existingEmployee.rowCount === 0) {
        await pool.query(
          'INSERT INTO employee (first_name, position, description) VALUES ($1, $2, $3)',
          [firstName, position, description]
        );
        console.log('Data inserted successfully');
      } else {
        console.log('Employee already exists');
      }
    } catch (error) {
      console.error(error);
    }
  }
}

export async function findAllEmployees(req: Request, res: Response) {
  const searchTerm: string | undefined = req.query.searchTerm?.toString();
  let employees: IEmployeeRow[] = [];

  try {
    let query = 'SELECT * FROM employee';

    if (searchTerm) {
      query += ` WHERE first_name LIKE '%${searchTerm}%' OR position LIKE '%${searchTerm}%' OR description LIKE '%${searchTerm}%'`;
    } else {
      query += ' WHERE 1=1';
    }

    const result = await pool.query(query);
    employees = result.rows;
    res.json(employees);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export function parseEmployees(html: string): IEmployee[] {
  const employeesData: IEmployee[] = [];
  const $ = cheerio.load(html);
  $('.text-block-item').each((i, el) => {
    const firstName = $(el).find('h2').text();
    const position = $(el).find('.position.js-anim-h3').text();
    const description = $(el).find('p').text();
    employeesData.push({ firstName, position, description });
  });
  return employeesData;
}
