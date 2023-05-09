import axios from 'axios';
import dotenv from 'dotenv';
import express from 'express';
import employeeRouter from './controllers/employee.controller';
import { parseEmployees, saveEmployees } from './services/employee.service';

dotenv.config();

const url = process.env.JETUP_URL || 'https://jetup.digital/team';

const PORT: number = Number(process.env.PORT);
const app = express();

async function getHTML(): Promise<string> {
  const { data: html } = await axios.get(url);
  return html;
}

(async () => {
  const html = await getHTML();
  const employees = parseEmployees(html);
  await saveEmployees(employees);
})();

app.get('/employees', employeeRouter);

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
