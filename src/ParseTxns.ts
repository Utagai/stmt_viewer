import { readFileSync } from 'fs';
import parse from 'csv-parse/lib/sync';

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

// Txn is a shorthand alias for a processed transaction. Consumers of this
// module do not need to know about unprocessed vs. processed transactions.
export type Txn = processedTxn;

function processTxn(unprocessed: unprocessedTxn): processedTxn {
  return {
    transactionDate: unprocessed['Transaction Date'],
    postDate: unprocessed['Post Date'],
    description: unprocessed.Description,
    category: unprocessed.Category,
    amount: unprocessed.Amount,
  };
}

export function parseTxns(csvFilepath: string): Txn[] {
  const unparsedFileContents = readFileSync(csvFilepath, 'utf8');
  const rows: unprocessedTxn[] = parse(unparsedFileContents, {
    cast: true,
    cast_date: true,
    columns: true,
    skip_empty_lines: true,
  });

  return rows.map((row) => processTxn(row));
}
