import { argv } from 'process';

import { parseTxns, Txn } from './ParseTxns';

function getFilepath(): string {
  // We expect 2 arguments for the node invocation, and then one more for the
  // filepath.
  const NUM_EXPECTED_ARGS = 3;

  if (argv.length !== NUM_EXPECTED_ARGS) {
    throw Error(
      `expected 1 argument for the filepath, but received ${
        argv.length - NUM_EXPECTED_ARGS + 1
      } arguments`,
    );
  }

  return argv[NUM_EXPECTED_ARGS - 1];
}

type categoryToTotalAmount = { [category: string]: number };

type stats = {
  maxAmount: number;
  minAmount: number;
  totalAmountPerCategory: categoryToTotalAmount;
  totalAmount: number;
  averageAmount: number;
};

function sanitize(txns: Txn[]): Txn[] {
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
      // Identify costs from my subscriptions and make them into bills.
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

function summarize(txns: Txn[]): stats {
  // The code in this function prioritizes simplicity and readability over
  // performance, often computing values that could have been computed in a
  // single loop, over multiple ones via calls to e.g. `reduce()`. This is an
  // acceptable tradeoff because the sizes of statement CSVs that will ever be
  // passed into this program are so small that performance is negligible (the
  // CSVs I have for my card transactions could literally fit entirely into my
  // CPU's L1 cache (AMD Ryzen 3700x)).
  const sortedTxns = txns.sort((t1, t2) => {
    if (t1.amount > t2.amount) {
      return 1;
    }

    if (t1.amount < t2.amount) {
      return -1;
    }

    return 0;
  });

  // We could inline these variable assignments into the stats object creation
  // below, but given how some of these involve non-trivial calculations, I
  // prefer to keep them separate for readability, and the rest follow for
  // consistency.
  const minAmount = sortedTxns[0].amount;
  const maxAmount = sortedTxns[sortedTxns.length - 1].amount;
  const totalAmountPerCategory = sortedTxns.reduce((categoryToTotal, t) => {
    if (t.category in categoryToTotal) {
      return {
        ...categoryToTotal,
        [t.category]: categoryToTotal[t.category] + t.amount,
      };
    }

    return { ...categoryToTotal, [t.category]: t.amount };
  }, {} as categoryToTotalAmount);
  const totalAmount = sortedTxns.reduce((sum, t) => sum + t.amount, 0);
  const averageAmount = totalAmount / sortedTxns.length;

  return {
    maxAmount,
    minAmount,
    totalAmountPerCategory,
    totalAmount,
    averageAmount,
  };
}

function main() {
  const pathToPotentialCSVFile = getFilepath();
  const processedTxns = parseTxns(pathToPotentialCSVFile);
  console.log(summarize(sanitize(processedTxns)));
}

main();
