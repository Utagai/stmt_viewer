import { readFileSync } from 'fs';
import parse from 'csv-parse/lib/sync';
import { parse as dateparse } from 'date-fns';

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
  description: string;
  category: string;
  type: string;
  amount: number;
};

// Txn is a shorthand alias for a processed transaction. Consumers of this
// module do not need to know about unprocessed vs. processed transactions.
// TODO: Probably better to just avoid the abbreviation and prefer 'Transaction'.
export type Txn = processedTxn;

function processTxn(unprocessed: unprocessedTxn): processedTxn {
  return {
    transactionDate: unprocessed['Transaction Date'],
    description: unprocessed.Description,
    category: unprocessed.Category,
    type: unprocessed.Type,
    amount: unprocessed.Amount,
  };
}

export function parseTxns(csvFilepath: string): Txn[] {
  const unparsedFileContents = readFileSync(csvFilepath, 'utf8');
  const rows: unprocessedTxn[] = parse(unparsedFileContents, {
    cast: (value, context) => {
      // Unfortunately we have to do this for cases where we have descriptions
      // of the form (\w )+\d+. Not sure why, because if we don't csv-parse
      // interprets it as a date. Don't ask.
      if (context.column === 'Description') {
        return value.toString();
      }

      // Of course, after we implement a custom cast function, returning just
      // the value turns out _actual_ dates into strings. So here we are.
      if (
        context.column === 'Transaction Date' ||
        context.column === 'Post Date'
      ) {
        return dateparse(value.toString(), 'MM/dd/yyyy', new Date());
      }

      return value;
    },
    cast_date: true,
    columns: true,
    skip_empty_lines: true,
  });

  return rows.map((row) => processTxn(row));
}
