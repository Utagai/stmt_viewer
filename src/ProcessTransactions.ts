import { Transaction } from './Transaction';
import { TransactionsStats, CategoryStats } from './Stats';

// NOTE: This is obviously tailored to my needs. For example, if you own a
// car, converting 'Gas' into 'Convenience' may be the last thing you
// want. I don't own a car, so my 'Gas' expenditures are actually
// (strangely) always trips to 7/11 for a late night snack.
export const categoryRemaps: { [oldCategory: string]: string } = {
  'Health & Wellness': 'Convenience',
  Gas: 'Convenience',
  'Bills & Utilities': 'Bills',
  'Food & Drink': 'Restaurant',
  Entertainment: 'Shopping',
  'Gifts & Donations': 'Donations',
  Home: 'Shopping',
};

export const subscriptionDescriptions = [
  'INKDROP',
  'HELP.HBOMAX.COM',
  'GITHUB',
];

export function sanitize(txns: Transaction[]): Transaction[] {
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
      .map((txn) => {
        const { category } = txn;
        if (category in categoryRemaps) {
          return { ...txn, category: categoryRemaps[category] };
        }

        return txn;
      })
      // Identify costs from my subscriptions and put them into the bills
      // category, because not all the subscriptions I pay for set the category
      // to Bills & Utilities.
      .map((txn) => {
        if (subscriptionDescriptions.includes(txn.description)) {
          return { ...txn, category: 'Bills' };
        }

        return txn;
      })
  );
}

function summarizeTransactions(txns: Transaction[]): TransactionsStats {
  if (txns.length === 0) {
    // This whole program exists to summarize and report transactions... if we
    // don't have any, why are we ever here?
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

  // We could inline these variable assignments into the stats object creation
  // below, but given how some of these involve non-trivial calculations, I
  // prefer to keep them separate for readability, and the rest follow for
  // consistency.
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
