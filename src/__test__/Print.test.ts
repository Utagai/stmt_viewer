import 'process';
import { readFileSync } from 'fs';

import { WritableStream } from 'memory-streams';

import print from '../Print';

import TxnBuilder from './TxnBuilder';

describe('printing', () => {
  test('works correctly', () => {
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
    // NOTE: This file contains color escape codes.
    // When actually using this program in the terminal, output redirection is
    // correctly detected by chalk and color is disabled, but for the tests, we
    // output color because we are just invoking the function, not the program
    // from the shell. This is actually good, we'd like to verify that the
    // colors are correct too, though it does make the test brittle to changes
    // in Chalk. That said, I expect Chalk to be quite stable, given what it is.
    const expectedOutput = readFileSync(
      './src/__test__/testdata/Print/expected_output.txt',
    );
    expect(writable.toString()).toEqual(expectedOutput.toString());
  });
});
