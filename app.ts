import { argv } from 'process';
import { readFileSync } from 'fs';
import parse from 'csv-parse/lib/sync';

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

// This is a transaction that maps directly to the format of the CSV file we
// read in. It is unprocessed and will eventually be converted to a
// processedTransaction.
type unprocessedTxn = {
  'Transaction Date': Date;
  'Post Date': Date;
  Description: string;
  Category: string;
  Type: string;
  Amount: number;
  Memo: string;
};

// A processed transaction differs from an unprocessed transaction in a few
// ways:
// * No spaces in the object keys (more ergonomic).
// * Lowercases the field names for consistency.
// * Gets rid of columns in the CSV we do not care about (e.g. Memo).
//
// It is otherwise the same thing.
type processedTxn = {
  transactionDate: Date;
  postDate: Date;
  description: string;
  category: string;
  amount: number;
};

function processTxn(unprocessed: unprocessedTxn): processedTxn {
  return {
    transactionDate: unprocessed['Transaction Date'],
    postDate: unprocessed['Post Date'],
    description: unprocessed.Description,
    category: unprocessed.Category,
    amount: unprocessed.Amount,
  };
}

function main() {
  const filepath = getFilepath();
  const unparsedFileContents = readFileSync(filepath, 'utf8');
  const rows: unprocessedTxn[] = parse(unparsedFileContents, {
    cast: true,
    cast_date: true,
    columns: true,
    skip_empty_lines: true,
  });

  const processedTxns = rows.map((row) => processTxn(row));
  processedTxns.forEach((row) => console.log(row));
}

main();
