import { Transaction } from './Txn';
import { TransactionsStats, CategoryStats } from './Stats';

export function sanitize(txns: Transaction[]): Transaction[] {
  return (
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
      // NOTE: This is obviously tailored to my needs. For example, if you own a
      // car, converting 'Gas' into 'Convenience' may be the last thing you
      // want. I don't own a car, so my 'Gas' expenditures are actually
      // (strangely) always trips to 7/11 for a late night snack.
      .map((txn) => {
        const { category } = txn;
        let newCategoryName = category;
        switch (category) {
          case 'Health & Wellness':
          case 'Gas':
            newCategoryName = 'Convenience';
            break;
          case 'Bills & Utilities':
            newCategoryName = 'Bills';
            break;
          case 'Food & Drink':
            newCategoryName = 'Restaurant';
            break;
          case 'Entertainment':
            newCategoryName = 'Shopping';
            break;
          case 'Gifts & Donations':
            newCategoryName = 'Donations';
            break;
          case 'Home':
            newCategoryName = 'Shopping';
            break;
          default:
        }

        return { ...txn, category: newCategoryName };
      })
      // Identify costs from my subscriptions and put them into the bills
      // category.
      .map((txn) => {
        switch (txn.description) {
          case 'INKDROP':
          case 'HELP.HBOMAX.COM':
          case 'GITHUB':
            return { ...txn, category: 'Bills' };
          default:
            return txn;
        }
      })
  );
}

export function summarizeTransactions(txns: Transaction[]): TransactionsStats {
  // The code in this function prioritizes simplicity and readability over
  // performance, often computing values that could have been computed in a
  // single loop, over multiple ones via calls to e.g. `reduce()`. This is an
  // acceptable tradeoff because the sizes of statement CSVs that will ever be
  // passed into this program are so small that performance is negligible (the
  // CSVs I have for my card transactions could literally fit entirely into my
  // CPU's L1 cache (AMD Ryzen 3700x)).
  const sortedTxns = txns.sort((t1, t2) => {
    if (t1.amount > t2.amount) {
      return -1;
    }

    if (t1.amount < t2.amount) {
      return 1;
    }

    return 0;
  });

  // We could inline these variable assignments into the stats object creation
  // below, but given how some of these involve non-trivial calculations, I
  // prefer to keep them separate for readability, and the rest follow for
  // consistency.
  const minTxn = sortedTxns[0];
  const maxTxn = sortedTxns[sortedTxns.length - 1];
  const totalAmount = sortedTxns.reduce((sum, t) => sum + t.amount, 0);
  const averageAmount = totalAmount / sortedTxns.length;

  return {
    maxTxn,
    minTxn,
    totalAmount,
    averageAmount,
    transactions: sortedTxns,
  };
}

export function summarize(
  txns: Transaction[],
): [TransactionsStats, CategoryStats] {
  // The code in this function prioritizes simplicity and readability over
  // performance, often computing values that could have been computed in a
  // single loop, over multiple ones via calls to e.g. `reduce()`. This is an
  // acceptable tradeoff because the sizes of statement CSVs that will ever be
  // passed into this program are so small that performance is negligible (the
  // CSVs I have for my card transactions could literally fit entirely into my
  // CPU's L1 cache (AMD Ryzen 3700x)).
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
