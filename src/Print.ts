import { Writable } from 'stream';

import { format } from 'date-fns';
import chalk from 'chalk';

import { CategoryStats, TransactionsStats } from './Stats';

// NOTE: This is just so hacky. I hate it. I'm not even completely sure why this
// happens.
// The full story is that we discovered that when running the E2E tests by
// themselves, we output no color because Chalk, for whatever reason, turns it
// off.
// When we run the test alongside all of our tests (e.g. just running `npm run
// test`), we _do_ output color.
// So what gives? I'm not sure. Some stuff I read suggests that Jest runs
// differently when it runs a single test file vs. all of them, the latter
// involving worker processes. Maybe their situation/TTY/etc is different?
// Anyways, I chucked this stupid thing in to make sure we always output color.
if (process.env.JEST_WORKER_ID) {
  chalk.level = 3; // Level 3 means that all colors are enabled
}

// Prints out a report to the terminal.
export default function print(
  out: Writable,
  [stats, categoryStats]: [TransactionsStats, CategoryStats],
) {
  printStats(out, 'All Transactions', stats);

  Object.keys(categoryStats).forEach((category) => {
    printStats(out, category, categoryStats[category]);
  });
}

// Prints out the stats in a human-readable format.
function printStats(out: Writable, header: string, stats: TransactionsStats) {
  printTopLevelSeparator(out, header);
  alignedPrint(
    out,
    [
      [
        chalk.underline('Total Amount:'),
        chalk.magentaBright(amountToDollarString(stats.totalAmount)),
      ],
      [
        chalk.underline('Number of transactions:'),
        chalk.dim.magentaBright(stats.transactions.length.toString()),
      ],
      [
        chalk.underline('Average Amount:'),
        chalk.dim.magentaBright(amountToDollarString(stats.averageAmount)),
      ],
      ['', ''], // Empty line for spacing.
      [chalk.bgGray('Largest transaction:'), ''],
      [
        chalk.underline('Amount:'),
        chalk.magentaBright(amountToDollarString(stats.maxTxn.amount)),
      ],
      [chalk.underline('Description:'), chalk.green(stats.maxTxn.description)],
      [chalk.underline('Category:'), chalk.green(stats.maxTxn.category)],
      [
        chalk.underline('Date'),
        chalk.green(dateToString(stats.maxTxn.transactionDate)),
      ],
    ],
    1,
  );

  printBottomLevelSeparator(out);

  alignedPrint(
    out,
    stats.transactions.map((txn) => [
      chalk.dim.green(txn.description),
      chalk.dim.magentaBright(amountToDollarString(txn.amount)),
      chalk.dim.green(txn.category),
      chalk.dim.green(dateToString(txn.transactionDate)),
    ]),
    1,
  );
}

///
/// Utility helper functions for the display format.
///

const topLevelSeparatorWidth = 100;
const topLevelSeparator = ' '.repeat(topLevelSeparatorWidth);
const bottomLevelSeparatorWidth = 50;
const bottomLevelSeparator = '─'.repeat(bottomLevelSeparatorWidth);

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
function alignedPrint(out: Writable, lines: string[][], indent: number) {
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
      out.write(`${'\t'.repeat(indent)}${paddedPiece}\t`);
    });
    out.write('\n');
  });
}

// Prints a separator for use in separating sections. Separators are labeled
// with a header. These are always not indented since they separate sections
// themselves.
function printTopLevelSeparator(out: Writable, header: string) {
  if (header.length >= topLevelSeparatorWidth) {
    throw Error(
      `header cannot be longer than the separator width (${topLevelSeparatorWidth})`,
    );
  }
  out.write(chalk.bgGray(`${chalk.underline(header)}${topLevelSeparator}\n`));
}

// Prints a separator for use separating _within_ sections. These are always
// indented once to indicate that it is separating within the section, not
// separating between sections themselves.
function printBottomLevelSeparator(out: Writable) {
  out.write(`\t${bottomLevelSeparator}\n`);
}

function dateToString(d: Date): string {
  return format(d, 'E MMM dd RRRR');
}

function amountToDollarString(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
