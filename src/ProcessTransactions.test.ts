import { Transaction } from './Transaction';
import { sanitize } from './ProcessTransactions';

class TxnBuilder {
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
      amount: -1,
    };
  }

  setTransactionDate(txnDate: Date): TxnBuilder {
    this.txn.transactionDate = txnDate;
    return this;
  }

  setDescription(desc: string): TxnBuilder {
    this.txn.description = desc;
    return this;
  }

  setCategory(cat: string): TxnBuilder {
    this.txn.category = cat;
    return this;
  }

  setType(typ: string): TxnBuilder {
    this.txn.type = typ;
    return this;
  }

  setAmount(amt: number): TxnBuilder {
    this.txn.amount = amt;
    return this;
  }

  preprocessed(): Transaction {
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

describe('sanitizing transactions', () => {
  test('removes payment type transactions', () => {
    const input = [
      new TxnBuilder().setType('Payment').preprocessed(),
      new TxnBuilder().setType('Not a Payment').preprocessed(),
    ];
    // Expect only the non-payment to be returned.
    const expectedOutput = [
      new TxnBuilder().setType('Not a Payment').processed(),
    ];
    expect(sanitize(input)).toEqual(expectedOutput);
  });
});
