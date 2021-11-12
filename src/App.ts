import { argv } from 'process';

import { parseTxns } from './Txn';
import { sanitize, summarize } from './ProcessTxns';
import print from './Print';

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

function main() {
  const pathToPotentialCSVFile = getFilepath();
  const processedTxns = parseTxns(pathToPotentialCSVFile);
  const sanitizedTxns = sanitize(processedTxns);
  const txnsStats = summarize(sanitizedTxns);
  print(txnsStats);
}

main();
