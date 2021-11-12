import { Txn } from './Txn';

// categoryStats captures statistics for one particular category. As a result,
// it stores no information about categories, since it only only works on
// transactions that are all from the same category.
export type categoryStats = {
  maxTxn: Txn;
  minTxn: Txn;
  totalAmount: number;
  averageAmount: number;
  // txns: Txn[];
};

export type categoryToTotalAmount = { [category: string]: categoryStats };

// txnsStats captures statistics for a given set of transactions. It relies on
// categoryStats to give a more in-depth view into transactions of a given
// category.
export type txnsStats = {
  maxTxn: Txn;
  minTxn: Txn;
  statsPerCategory: categoryToTotalAmount;
  totalAmount: number;
  averageAmount: number;
};
