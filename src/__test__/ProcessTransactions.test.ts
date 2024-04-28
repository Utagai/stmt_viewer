import { Transaction } from '../Transaction';
import { TransactionsStats } from '../Stats';

import TxnBuilder from './TxnBuilder';

import { sanitize, summarize } from '../ProcessTransactions';
import { Config, CategoryMapping, DescriptionMapping } from '../Config';

const categoryMappings: CategoryMapping[] = [
  { from: 'Health & Wellness', to: 'Convenience' },
  { from: 'Gas', to: 'Convenience' },
  { from: 'Bills & Utilities', to: 'Bills' },
  { from: 'Food & Drink', to: 'Restaurant' },
  { from: 'Entertainment', to: 'Shopping' },
  { from: 'Gifts & Donations', to: 'Donations' },
  { from: 'Home', to: 'Shopping' },
];

const descriptionMappings: DescriptionMapping[] = [
  { from: 'INKDROP', to: 'Bills' },
  { from: 'HELP.HBOMAX.COM', to: 'Bills' },
  { from: 'GITHUB', to: 'Bills' },
];

const basicTestCfg: Config = {
  categories: ['Convenience', 'Shopping', 'Bills', 'Restaurant', 'Donations'],
  categoryMappings,
  descriptionMappings,
};

describe('transaction sanitization', () => {
  test('removes payment type transactions', () => {
    const input = [
      new TxnBuilder().type('Payment').unprocessed(),
      new TxnBuilder().type('Not a Payment').unprocessed(),
    ];
    // Expect only the non-payment to be returned.
    const expectedOutput = [new TxnBuilder().type('Not a Payment').processed()];
    expect(sanitize(basicTestCfg, input)).toEqual(expectedOutput);
  });

  test('negates amount to a positive value', () => {
    const input = [new TxnBuilder().unprocessed()];
    const actualOutput = sanitize(basicTestCfg, input);
    expect(actualOutput).toHaveLength(1);
    // We expect the _negation_.
    expect(actualOutput[0].amount).toEqual(-TxnBuilder.defaultAmount);
  });

  function unzipTxns(
    txns: [Transaction, Transaction][],
  ): [Transaction[], Transaction[]] {
    return txns.reduce(
      (allInputsAndAllOutputs, inputAndOutput) => {
        allInputsAndAllOutputs[0].push(inputAndOutput[0]);
        allInputsAndAllOutputs[1].push(inputAndOutput[1]);
        return allInputsAndAllOutputs;
      },
      [[], []] as [Transaction[], Transaction[]],
    );
  }

  test('converts via category remap rules to the correct category', () => {
    const [inputTxns, expectedOutputTxns] = unzipTxns(
      // Goes from:
      // { [oldCategory: string]: string } -> [Transaction, Transaction][].
      // A map of category remaps -> An array of tuples of input & expected
      // output transactions.
      categoryMappings.map((oldCategory) => {
        const inputTxn = new TxnBuilder()
          .category(oldCategory.from)
          .unprocessed();
        const outputTxn = new TxnBuilder().category(oldCategory.to).processed();
        return [inputTxn, outputTxn];
      }),
    );
    expect(sanitize(basicTestCfg, inputTxns)).toEqual(expectedOutputTxns);
  });

  test('converts via subscription remap rules to the correct category', () => {
    const [inputTxns, expectedOutputTxns] = unzipTxns(
      // Goes from:
      // string[] -> [Transaction, Transaction][].
      // A map of known subscription service transaction descriptions -> An
      // array of tuples of input & expected output transactions.
      descriptionMappings
        // For each re-mapped category, create a tuple of the input that triggers
        // the remap and an output that we will expect.
        .map((subscriptionDesc) => {
          const inputTxn = new TxnBuilder()
            .description(subscriptionDesc.from)
            .unprocessed();
          const outputTxn = new TxnBuilder()
            .description(subscriptionDesc.from)
            .category('Bills')
            .processed();
          return [inputTxn, outputTxn];
        }),
    );
    expect(sanitize(basicTestCfg, inputTxns)).toEqual(expectedOutputTxns);
  });
});

describe('summarizing transactions', () => {
  test('handles zero transactions', () => {
    expect(() => {
      summarize([]);
    }).toThrow('no transactions to summarize');
  });

  test('handles single transaction', () => {
    const txn = new TxnBuilder().processed();
    const [txnStats, categoryStats] = summarize([txn]);
    expect(txnStats).toEqual({
      maxTxn: txn,
      totalAmount: txn.amount,
      averageAmount: txn.amount,
      transactions: [txn],
    });
    expect(categoryStats).toEqual({
      [TxnBuilder.defaultCategory]: {
        maxTxn: txn,
        totalAmount: txn.amount,
        averageAmount: txn.amount,
        transactions: [txn],
      },
    });
  });

  function expectTxnsStatsToBeCloselyEqual(
    received: TransactionsStats,
    expected: TransactionsStats,
  ) {
    // NOTE: Technically, these two comparisons on Transactions could maybe also
    // have issues with f.p. precision, but chances are, due to how we write our
    // tests, it won't... we'll take the risk.
    expect(received.maxTxn).toEqual(expected.maxTxn);
    expect(received.transactions).toEqual(expected.transactions);

    expect(received.totalAmount).toBeCloseTo(expected.totalAmount);
    expect(received.averageAmount).toBeCloseTo(expected.averageAmount);
  }

  test('summarizes transactions correctly', () => {
    // In particular we'd like the following from our test set for coverage:
    // * At least 2 categories.
    // * At least 2 transactions for a categories.
    // * At least 1 category with only one transaction.
    // * The transactions to NOT be passed in sorted, descending order.
    //
    // NOTE: This test should likely be updated for any other statistics we
    // decide to include.
    // NOTE: We are being a bit lazy... ideally, we'd split many of the
    // described things into their own test cases, but this is such a simple and
    // trivial program that I don't think it is really worth it.
    const txns = [
      new TxnBuilder().category('1').amount(7.5).processed(),
      new TxnBuilder().category('2').amount(10.49).processed(),
      new TxnBuilder().category('1').amount(100.11).processed(),
      new TxnBuilder().category('2').amount(23.12).processed(),
      new TxnBuilder().category('3').amount(102.48).processed(),
    ];
    const [txnStats, categoryStats] = summarize(txns);

    // We compute most of the expected values 'by hand' so as to avoid repeated
    // bugs in the test code hiding actual bugs in the application code.
    expectTxnsStatsToBeCloselyEqual(txnStats, {
      maxTxn: txns[4],
      totalAmount: 243.7,
      averageAmount: 48.74,
      transactions: [txns[4], txns[2], txns[3], txns[1], txns[0]],
    });

    const expectedCategoryStats: { [category: string]: TransactionsStats } = {
      '1': {
        maxTxn: txns[2],
        totalAmount: 107.61,
        averageAmount: 53.805,
        transactions: [txns[2], txns[0]],
      },
      '2': {
        maxTxn: txns[3],
        totalAmount: 33.61,
        averageAmount: 16.81,
        transactions: [txns[3], txns[1]],
      },
      '3': {
        maxTxn: txns[4],
        totalAmount: txns[4].amount,
        averageAmount: txns[4].amount,
        transactions: [txns[4]],
      },
    };
    Object.keys(categoryStats).forEach((category) => {
      expectTxnsStatsToBeCloselyEqual(
        categoryStats[category],
        expectedCategoryStats[category],
      );
    });
  });
});
