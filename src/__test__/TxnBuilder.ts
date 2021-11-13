import { Transaction } from '../Transaction';

export default class TxnBuilder {
  static defaultCategory: string = 'default category';

  static defaultAmount: number = -1;

  static defaultDate: Date = new Date();

  txn: Transaction;

  constructor() {
    this.txn = {
      transactionDate: TxnBuilder.defaultDate,
      description: 'default description',
      category: TxnBuilder.defaultCategory,
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
    if (this.txn.amount < 0) {
      this.txn.amount *= -1;
    }
    return this.txn;
  }
}
