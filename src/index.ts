import axios from 'axios';
import cheerio from 'cheerio';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import pool from './db';
import { IEmployee, IEmployeeRow } from './employee.interface';

dotenv.config();

const url = process.env.JETUP_URL || 'https://jetup.digital/team';

const PORT: number = Number(process.env.PORT);
const app = express();

// Function for getting the HTML code of a page with employees
async function getHTML(): Promise<string> {
  const { data: html } = await axios.get(url);
  return html;
}

// Function for parsing employees from HTML code
function parseEmployees(html: string): IEmployee[] {
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

// Function for saving employees to the database.
async function saveEmployees(employees: IEmployee[]): Promise<void> {
  for (const employee of employees) {
    const { firstName, position, description } = employee;
    try {
      await pool.query(
        'INSERT INTO employee (first_name, position, description) VALUES ($1, $2, $3)',
        [firstName, position, description]
      );
      console.log('Data inserted successfully');
    } catch (error) {
      console.error(error);
    }
  }
}

// Parsing the list of employees and saving it to the database when the server starts.
(async () => {
  const html = await getHTML();
  const employees = parseEmployees(html);
  await saveEmployees(employees);
})();

// Route to get a list of employees with the ability to filter by search string.
app.get('/employees', async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }

  res.json(employees);
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
