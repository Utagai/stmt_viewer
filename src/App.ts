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
  txns: Txn[];
};

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
    txns: sortedTxns,
  };
}

function main() {
  const pathToPotentialCSVFile = getFilepath();
  const processedTxns = parseTxns(pathToPotentialCSVFile);
  console.log(summarize(processedTxns));
}

main();
