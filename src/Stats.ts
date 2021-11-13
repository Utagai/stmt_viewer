import { Txn } from './Txn';

// categoryStats captures statistics for one particular category. As a result,
// it stores no information about categories, since it only only works on
// transactions that are all from the same category.
// TODO: This is false technically, because really this is a stats over any
// array of transactions, _ignoring_ category.
// TODO: I think we don't need the minimum txn, but we may want median.
export type CategoryStats = {
  maxTxn: Txn;
  minTxn: Txn;
  totalAmount: number;
  averageAmount: number;
  txns: Txn[];
};

export type CategoryToTotalAmount = { [category: string]: CategoryStats };

// txnsStats captures statistics for a given set of transactions. It relies on
// categoryStats to give a more in-depth view into transactions of a given
// category.
export type TxnsStats = {
  maxTxn: Txn;
  minTxn: Txn;
  statsPerCategory: CategoryToTotalAmount;
  totalAmount: number;
  averageAmount: number;
  txns: Txn[];
};
