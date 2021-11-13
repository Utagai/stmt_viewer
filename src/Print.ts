import { stdout } from 'process';

import { format } from 'date-fns';

import { CategoryStats, TxnsStats } from './Stats';

// Prints out a report to the terminal.
// In particular, we want to print out these things in the listed order:
//
// * Max/min transaction
// * Per category:
//  * Total amount per category
//  * Average amount per category
//  * Max transaction per category
// * Total amount
// * Average amount
// * All transactions per category, sorted from highest to lowest.
// * All transactions, sorted from highest to lowest.
//
// And, for readability, we'd like to separate these sections with some kind of
// very visible separator.
export default function print(stats: TxnsStats) {
  // All the transactions will be printed at the end instead of now.
  // TODO: The comment above is false.
  printStats('All Transactions', stats);

  Object.keys(stats.statsPerCategory).forEach((category) => {
    printStats(category, stats.statsPerCategory[category]);
  });
}

// Prints out a subset of the category stats.
// TODO: Update this comment and maybe add note about categoryStats being a
// subste of txnsStats...
function printStats(header: string, stats: CategoryStats) {
  printTopLevelSeparator(header);
  alignedPrint(
    [
      ['Total Amount:', amountToDollarString(stats.totalAmount)],
      ['Number of transactions:', stats.txns.length.toString()],
      ['Average Amount:', amountToDollarString(stats.averageAmount)],
      ['', ''], // Empty space.
      ['Largest transaction:', ''],
      ['Description:', stats.maxTxn.description],
      ['Amount:', amountToDollarString(stats.maxTxn.amount)],
      ['Category:', stats.maxTxn.category],
      ['Date', dateToString(stats.maxTxn.transactionDate)],
    ],
    1,
  );

  printBottomLevelSeparator();
  alignedPrint(
    stats.txns.map((txn) => [
      txn.description,
      amountToDollarString(txn.amount),
      txn.category,
      dateToString(txn.transactionDate),
    ]),
    1,
  );
}

///
/// Utility helper functions for the display format.
///

// alignedPrint prints a 2D array of strings referring to multiple lines with
// distinct pieces. It prints these lines such that for the nth line, the ith
// piece lines up with the ith pieces of the (n-1)th line and (n+1)th line. The
// alignment is on the _left_ (start) of each piece.
// This function assumes that pieces contains arrays of all equal length. The
// behavior is undefined if this is not true.
//
// For example:
//
// SUPER FRESH     1.49    Groceries       Wed Oct 27 2021
// DUNKIN #339369 Q35      1.73    Restaurant      Fri Nov 05 2021
// SUPER FRESH     2.39    Groceries       Wed Oct 28 2021
// KEY FOOD MARKET PLACE   2.17    Groceries       Wed Oct 20 2021
// RITE AID 10574  2.43    Convenience     Tue Oct 19 2021
//
// becomes:
//
// SUPER FRESH                             1.49            Groceries               Wed Oct 27 2021
// DUNKIN #339369 Q35                      1.73            Restaurant              Fri Nov 05 2021
// SUPER FRESH                             2.39            Groceries               Wed Oct 28 2021
// KEY FOOD MARKET PLACE                   2.17            Groceries               Wed Oct 20 2021
// RITE AID 10574                          2.43            Convenience             Tue Oct 19 2021
function alignedPrint(lines: string[][], indent: number) {
  const maxLengthValuePerColumn = Array(lines[0].length).fill(0);
  // We iterate by _column_, so we want to loop for pieces[0].length, not
  // pieces.length.
  for (let i = 0; i < lines[0].length; i += 1) {
    const ithColumnLengths = lines.map((pieces) => pieces[i].length);
    maxLengthValuePerColumn[i] = Math.max(...ithColumnLengths);
  }

  // For each line, we want to print it out properly aligned and add a newline.
  // For each piece in a line, we want to print the piece with enough spaces
  // added so that every piece in the column has the same width, which ensures
  // that the next pieces on each row start at the same position.
  lines.forEach((pieces) => {
    pieces.forEach((piece, i) => {
      const paddedPiece = `${piece}${' '.repeat(
        maxLengthValuePerColumn[i] - piece.length,
      )}`;
      stdout.write(`${'\t'.repeat(indent)}${paddedPiece}\t`);
    });
    stdout.write('\n');
  });
}

const sectionSeparatorWidth = 80;

// Prints a separator for use in separating sections. Separators are labeled
// with a header.
function printTopLevelSeparator(header: string) {
  // Add a space to the header because otherwise it'll look kinda of bad.
  // Adding it now and using paddedHeader in the rest of the function lets us
  // avoid having to add in random/ugly -1/+1's.
  const paddedHeader = `${header} `;
  if (paddedHeader.length >= sectionSeparatorWidth) {
    throw Error(
      `header with padding cannot be longer than the separator width (${sectionSeparatorWidth})`,
    );
  }
  const sectionSeparator = '='.repeat(
    sectionSeparatorWidth - paddedHeader.length,
  );
  stdout.write(`${paddedHeader}${sectionSeparator}\n`);
}

// Prints a separator for use in separator parts of a section.
function printBottomLevelSeparator() {
  const sectionSeparator = '-'.repeat(5);
  stdout.write(`\t${sectionSeparator}\n`);
}

function dateToString(d: Date) {
  return format(d, 'E MMM dd RRRR');
}

function amountToDollarString(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
