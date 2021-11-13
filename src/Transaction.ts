import { readFileSync } from 'fs';
import parse from 'csv-parse/lib/sync';
import { parse as dateparse } from 'date-fns';

// This is a transaction that maps directly to the format of the CSV file we
// read in. It is 'raw' and will eventually be converted to a proper Transaction
// type.
//
// In contrast, a 'proper' transaction differs from an raw transaction
// in a few ways:
// * No spaces in the object keys (more ergonomic).
// * Lowercases the field names for consistency.
// * Gets rid of columns in the CSV we do not care about (e.g. Memo).
type rawTransaction = {
  'Transaction Date': Date;
  'Post Date': Date;
  Description: string;
  Category: string;
  Type: string;
  Amount: number;
  Memo: string;
};

export type Transaction = {
  transactionDate: Date;
  description: string;
  category: string;
  type: string;
  amount: number;
};

function convertFromRaw(rawTxn: rawTransaction): Transaction {
  return {
    transactionDate: rawTxn['Transaction Date'],
    description: rawTxn.Description,
    category: rawTxn.Category,
    type: rawTxn.Type,
    amount: rawTxn.Amount,
  };
}

export function parseTxns(csvFilepath: string): Transaction[] {
  const unparsedFileContents = readFileSync(csvFilepath, 'utf8');
  const rawTxns: rawTransaction[] = parse(unparsedFileContents, {
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

      if (context.column === 'Amount') {
        return parseFloat(value);
      }

      return value;
    },
    cast_date: true,
    columns: true,
    skip_empty_lines: true,
  });

  return rawTxns.map((rawTxn) => convertFromRaw(rawTxn));
}
