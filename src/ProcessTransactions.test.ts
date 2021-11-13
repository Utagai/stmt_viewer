import { Transaction } from './Transaction';
import {
  sanitize,
  categoryRemaps,
  subscriptionDescriptions,
} from './ProcessTransactions';

class TxnBuilder {
  static defaultAmount: number = -1;

  txn: Transaction;

  constructor() {
    this.txn = {
      transactionDate: new Date(),
      description: 'default description',
      category: 'default category',
      type: 'default type',
      // Note: transactions are typically negative valued before processing.
      // This is because because I'm _owing_ the money... we only _print_
      // positive numbers because the processing inverts the sign for
      // readability/convenience.
      amount: TxnBuilder.defaultAmount,
    };
  }

  transactionDate(txnDate: Date): TxnBuilder {
    this.txn.transactionDate = txnDate;
    return this;
  }

  description(desc: string): TxnBuilder {
    this.txn.description = desc;
    return this;
  }

  category(cat: string): TxnBuilder {
    this.txn.category = cat;
    return this;
  }

  type(typ: string): TxnBuilder {
    this.txn.type = typ;
    return this;
  }

  amount(amt: number): TxnBuilder {
    this.txn.amount = amt;
    return this;
  }

  unprocessed(): Transaction {
    return this.txn;
  }

  processed(): Transaction {
    // See comment above on why amount is set to -1 initially.
    // This method is not strictly necessary, it just makes writing the tests
    // easier.
    this.txn.amount *= -1;
    return this.txn;
  }
}

describe('transaction sanitization', () => {
  test('removes payment type transactions', () => {
    const input = [
      new TxnBuilder().type('Payment').unprocessed(),
      new TxnBuilder().type('Not a Payment').unprocessed(),
    ];
    // Expect only the non-payment to be returned.
    const expectedOutput = [new TxnBuilder().type('Not a Payment').processed()];
    expect(sanitize(input)).toEqual(expectedOutput);
  });

  test('negates amount to a positive value', () => {
    const input = [new TxnBuilder().unprocessed()];
    const actualOutput = sanitize(input);
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

  test('converts certain categories', () => {
    const [inputTxns, expectedOutputTxns] = unzipTxns(
      // Goes from:
      // { [oldCategory: string]: string } -> [Transaction, Transaction][].
      // A map of category remaps -> An array of tuples of input & expected
      // output transactions.
      Object.keys(categoryRemaps).map((oldCategory) => {
        const inputTxn = new TxnBuilder().category(oldCategory).unprocessed();
        const outputTxn = new TxnBuilder()
          .category(categoryRemaps[oldCategory])
          .processed();
        return [inputTxn, outputTxn];
      }),
    );
    expect(sanitize(inputTxns)).toEqual(expectedOutputTxns);
  });

  test('converts certain known subscription descriptions to the correct category', () => {
    const [inputTxns, expectedOutputTxns] = unzipTxns(
      // Goes from:
      // string[] -> [Transaction, Transaction][].
      // A map of known subscription service transaction descriptions -> An
      // array of tuples of input & expected output transactions.
      subscriptionDescriptions
        // For each re-mapped category, create a tuple of the input that triggers
        // the remap and an output that we will expect.
        .map((subscriptionDesc) => {
          const inputTxn = new TxnBuilder()
            .description(subscriptionDesc)
            .unprocessed();
          const outputTxn = new TxnBuilder()
            .description(subscriptionDesc)
            .category('Bills')
            .processed();
          return [inputTxn, outputTxn];
        }),
    );
    expect(sanitize(inputTxns)).toEqual(expectedOutputTxns);
  });
});
