import { argv } from 'process';

import { parseTxns } from './ParseTxns';

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
  processedTxns.forEach((row) => console.log(row));
}

main();
