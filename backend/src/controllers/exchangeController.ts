import { Request, Response } from 'express';
import { CurrencyService } from '../services/currencyService.js';

export async function getExchangeRates(req: Request, res: Response) {
  try {
    const { base = 'USD' } = req.query;

    const rates = await CurrencyService.getAllRates(base as string);

    res.json({
      base,
      rates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ message: 'Failed to fetch exchange rates' });
  }
}
