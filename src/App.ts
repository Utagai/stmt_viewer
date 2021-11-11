import { loadTxns } from './LoadTxns';

function main() {
  const processedTxns = loadTxns();
  processedTxns.forEach((row) => console.log(row));
}

main();
