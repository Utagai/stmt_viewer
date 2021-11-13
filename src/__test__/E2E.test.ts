import { exec } from 'child_process';
import { readFileSync } from 'fs';

// Set the timeout for 10 seconds, since this test often takes about 5~ seconds.
jest.setTimeout(10 * 1000);

describe('e2e', () => {
  test('prints correct report without error', (done) => {
    exec(
      'npm run start -- ./src/__test__/testdata/E2E/test.csv',
      (error, stdout, _) => {
        try {
          expect(error).toBeFalsy();

          // NOTE: This file contains color escape codes.
          // When actually using this program in the terminal, output redirection is
          // correctly detected by chalk and color is disabled, but for the tests, we
          // output color because we are just invoking the function, not the program
          // from the shell. This is actually good, we'd like to verify that the
          // colors are correct too, though it does make the test brittle to changes
          // in Chalk. That said, I expect Chalk to be quite stable, given what it is.
          const expectedOutput = readFileSync(
            './src/__test__/testdata/E2E/expected_output.txt',
          ).toString();
          expect(stdout).toEqual(expectedOutput);
          done();
        } catch (err) {
          done(err);
        }
      },
    );
  });
});
