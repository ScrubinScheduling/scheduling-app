import express from 'express';
import { getAllShifts } from  '../controllers/shiftController';

const router = express.Router();

router.get('/', getAllShifts);

export default router;