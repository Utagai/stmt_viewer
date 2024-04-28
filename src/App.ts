import { argv, stdout } from 'process';
import { parseTxns } from './Transaction';
import { sanitize, summarize } from './ProcessTransactions';
import { loadConfig } from './Config';
import print from './Print';

function getFilepaths(): [string, string] {
  // We expect 3 arguments for the node invocation, the config file, and the filepath.
  const NUM_EXPECTED_ARGS = 4;

  if (argv.length !== NUM_EXPECTED_ARGS) {
    throw Error(
      `expected 2 arguments for the config file and filepath, but received ${
        argv.length - NUM_EXPECTED_ARGS + 1
      } arguments`,
    );
  }

  return [argv[NUM_EXPECTED_ARGS - 2], argv[NUM_EXPECTED_ARGS - 1]];
}

function main() {
  const [pathToConfigFile, pathToPotentialCSVFile] = getFilepaths();
  const config = loadConfig(pathToConfigFile);
  const processedTxns = parseTxns(pathToPotentialCSVFile);
  const sanitizedTxns = sanitize(config, processedTxns);
  const stats = summarize(sanitizedTxns);
  print(stdout, stats);
}

main();
