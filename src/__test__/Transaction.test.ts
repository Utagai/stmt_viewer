import { parse } from 'date-fns';

import { parseTxns } from '../Transaction';

import TxnBuilder from './TxnBuilder';

describe('transaction parsing', () => {
  test('can parse csv', () => {
    const txns = parseTxns('./testdata/test.csv');
    expect(txns).toEqual([
      new TxnBuilder()
        .transactionDate(parse('11/06/2021', 'MM/dd/yyyy', new Date()))
        .description('HELLO WORLD')
        .category('Something')
        .type('Sale')
        .amount(-20.68)
        .unprocessed(),
      new TxnBuilder()
        .transactionDate(parse('11/05/2021', 'MM/dd/yyyy', new Date()))
        .description('MEANING IS #42')
        .category('Something')
        .type('Payment')
        .amount(1.73)
        .unprocessed(),
      new TxnBuilder()
        .transactionDate(parse('11/05/2021', 'MM/dd/yyyy', new Date()))
        .description('LOL % LOL')
        .category('Something Else')
        .type('Sale')
        .amount(-9.99)
        .unprocessed(),
    ]);
  });
});
