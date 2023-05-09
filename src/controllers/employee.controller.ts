import express from 'express';
import { findAllEmployees } from '../services/employee.service';

const router = express.Router();

router.get('/employees', findAllEmployees);

export default router;
