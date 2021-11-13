import { Transaction } from './Transaction';

// Captures statistics for a set of transactions without any respect to
// category. As a result, it stores no information about categories.
// TODO: I think we don't need the minimum transaction, but we may want median.
export type TransactionsStats = {
  maxTxn: Transaction;
  totalAmount: number;
  averageAmount: number;
  transactions: Transaction[];
};

export type CategoryStats = { [category: string]: TransactionsStats };
