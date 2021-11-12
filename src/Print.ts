import { stdout } from 'process';

import { format } from 'date-fns';

import { Txn } from './Txn';
import { categoryStats, txnsStats } from './Stats';

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
export default function print(stats: txnsStats) {
  printMinMaxTransaction(stats);
  printSectionSeparator();

  Object.keys(stats.statsPerCategory).forEach((category) => {
    printCategoryStats(category, stats.statsPerCategory[category]);
  });
  printSectionSeparator();

  printHeader('All Transactions');
  printLabelAndValue('Number of transactions', stats.txns.length);
  printLabelAndValue('Total Amount', stats.totalAmount);
  printLabelAndValue('Average Amount', stats.averageAmount);
  printBottomLevelSeparator();

  // TODO: This should also go to stderr so it can be re-routed, since it is
  // extra verbosity.
  stats.txns.forEach((txn) => {
    printTransactionAsRow(txn);
  });
  printSectionSeparator();
}

function printMinMaxTransaction(stats: txnsStats) {
  printHeader('Largest transaction');
  printTransactionAcrossLines(stats.maxTxn);
  printHeader('Smallest transaction');
  printTransactionAcrossLines(stats.minTxn);
}

// Prints the transaction across lines, one for each field we care to print.
// TODO: We should line up the values here on the same column for readability.
function printTransactionAcrossLines(txn: Txn) {
  printLabelAndValue('Description', txn.description);
  // TODO: We should print this in a human friendly dollar format, e.g., $54.23.
  // Meaning, we want the dollar sign, and want to always have 2 decimal places.
  printLabelAndValue('Amount', txn.amount);
  printLabelAndValue('Category', txn.category);
  // TODO: We should only print the date (not time).
  printLabelAndValue('Date', dateToString(txn.transactionDate));
}

// Prints the transaction as a row, with all fields we care to print on one
// line.
function printTransactionAsRow(txn: Txn) {
  stdout.write(
    `\t${txn.description}\t${txn.amount}\t${txn.category}\t${dateToString(
      txn.transactionDate,
    )}\n`,
  );
}

function dateToString(d: Date) {
  return format(d, 'E MMM dd RRRR');
}

// Prints out a subset of the category stats.
function printCategoryStats(category: string, stats: categoryStats) {
  printHeader(category);
  printTransactionAcrossLines(stats.maxTxn);
  printBottomLevelSeparator();
  // TODO: This should go to stderr so it can be re-routed, since it is extra
  // verbosity.
  stats.txns.forEach((txn) => {
    printTransactionAsRow(txn);
  });
  printLabelAndValue('Total Amount', stats.totalAmount);
  printLabelAndValue('Average Amount', stats.totalAmount);
}

///
/// Utility helper functions for the display format.
///

// Prints a separator for use in separating sections.
function printSectionSeparator() {
  const sectionSeparator = '='.repeat(80);
  stdout.write(`${sectionSeparator}\n`);
}

// Prints a separator for use in separator parts of a section.
function printBottomLevelSeparator() {
  const sectionSeparator = '-'.repeat(5);
  stdout.write(`\t${sectionSeparator}\n`);
}

function printHeader(header: string) {
  stdout.write(`${header}:\n`);
}

interface StringableInterface {
  toString(): string;
}

type Stringable = string | StringableInterface;

function printLabelAndValue(label: string, value: Stringable) {
  stdout.write(`\t${label}: ${value.toString()}\n`);
}
