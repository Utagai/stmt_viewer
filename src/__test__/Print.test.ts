import { readFileSync } from 'fs';

import { WritableStream } from 'memory-streams';

import print from '../Print';

import TxnBuilder from './TxnBuilder';

describe('printing', () => {
  test('works', () => {
    const txns = [
      new TxnBuilder().description('first').amount(3).category('1').processed(),
      new TxnBuilder()
        .description('second')
        .amount(2)
        .category('1')
        .processed(),
      new TxnBuilder().description('third').amount(1).category('2').processed(),
    ];
    const txnStats = {
      maxTxn: txns[0],
      totalAmount: 6,
      averageAmount: 3,
      transactions: txns,
    };
    const categoryStats = {
      1: {
        maxTxn: txns[0],
        totalAmount: 5,
        averageAmount: 2.5,
        transactions: txns.slice(0, 2),
      },
      2: {
        maxTxn: txns[0],
        totalAmount: 1,
        averageAmount: 1,
        transactions: txns.slice(2),
      },
    };

    const writable = new WritableStream();
    print(writable, [txnStats, categoryStats]);
    const expectedOutput = readFileSync('./testdata/expected_print_output.txt');
    expect(writable.toString()).toEqual(expectedOutput.toString());
  });
});
