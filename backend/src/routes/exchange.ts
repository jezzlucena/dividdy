import { Router } from 'express';
import * as exchangeController from '../controllers/exchangeController.js';

const router = Router();

router.get('/', exchangeController.getExchangeRates);

export default router;
