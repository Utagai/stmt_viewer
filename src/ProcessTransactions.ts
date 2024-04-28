import { Transaction } from './Transaction';
import { TransactionsStats, CategoryStats } from './Stats';
import { Config } from './Config';

function mapCategory(cfg: Config, txn: Transaction): Transaction {
  const { categories, categoryMappings, descriptionMappings } = cfg;
  const { category, description } = txn;

  // First, map the original category to the newly specified one:
  const catMapping = categoryMappings.find((m) =>
    new RegExp(m.from).test(category),
  );
  if (catMapping) {
    return { ...txn, category: catMapping.to };
  }

  // Second, map the description to the newly specified category:
  const descMapping = descriptionMappings.find((m) =>
    new RegExp(m.from).test(description),
  );
  if (descMapping) {
    return { ...txn, category: descMapping.to };
  }

  // Third, and finally, bucket all the categories that don't fall into one of
  // the specified categories as "Other":
  if (!categories.includes(category)) {
    return { ...txn, category: 'Other' };
  }

  return txn;
}

export function sanitize(cfg: Config, txns: Transaction[]): Transaction[] {
  return (
    // TODO: This is a great example of a place where proper function names will
    // do a better job at documenting this code than our comments.
    txns
      // Remove payments which aren't purchases but me paying off balances, etc.
      .filter((txn) => txn.type !== 'Payment')
      // Negate amounts to positive values.
      .map((txn) => ({
        ...txn,
        amount: -txn.amount,
      }))
      // Convert certain categories to more readable versions, or merge some
      // together.
      .map((txn) => mapCategory(cfg, txn))
  );
}

function summarizeTransactions(txns: Transaction[]): TransactionsStats {
  if (txns.length === 0) {
    // This whole program exists to summarize and report transactions... if we
    // don't have any, why are we even here?
    throw Error('no transactions to summarize');
  }
  // The code in this function prioritizes simplicity and readability over
  // performance, often computing values that could have been computed in a
  // single loop, over multiple ones via calls to e.g. `reduce()`. This is an
  // acceptable tradeoff because the sizes of statement CSVs that will ever be
  // passed into this program are so small that performance is negligible (the
  // CSVs I have for my card transactions could literally fit entirely into my
  // CPU's L1 cache (AMD Ryzen 3700x)).
  const sortedTxns = [...txns].sort((t1, t2) => {
    if (t1.amount > t2.amount) {
      return -1;
    }

    if (t1.amount < t2.amount) {
      return 1;
    }

    return 0;
  });

  const maxTxn = sortedTxns[0];
  const totalAmount = sortedTxns.reduce((sum, t) => sum + t.amount, 0);
  const averageAmount = totalAmount / sortedTxns.length;

  return {
    maxTxn,
    totalAmount,
    averageAmount,
    transactions: sortedTxns,
  };
}

export function summarize(
  txns: Transaction[],
): [TransactionsStats, CategoryStats] {
  const stats = summarizeTransactions(txns);

  // We want to group all the transactions into arrays of transactions for each
  // unique category. Then, we want to summarize the statistics per array of
  // transactions and return an object that maps each category to its summary
  // statistics.
  const txnsPerCategory = stats.transactions.reduce((categoryToTotal, t) => {
    if (t.category in categoryToTotal) {
      return {
        ...categoryToTotal,
        [t.category]: categoryToTotal[t.category].concat([t]),
      };
    }

    return { ...categoryToTotal, [t.category]: [t] };
  }, {} as { [category: string]: Transaction[] });
  const categoryStats: CategoryStats = {};
  Object.keys(txnsPerCategory).forEach((key) => {
    categoryStats[key] = summarizeTransactions(txnsPerCategory[key]);
  });

  return [stats, categoryStats];
}
