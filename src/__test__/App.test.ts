import { exec } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

// Set the timeout for 10 seconds, since this test often takes about 5~ seconds.
jest.setTimeout(10 * 1000)

describe('e2e', () => {
  test('prints correct report without error', (done) => {
    exec(
      'npm run start -- ./src/__test__/testdata/E2E/test.csv',
      (error, stdout, stderr) => {
        try {
          expect(error).toBeFalsy();

          expect(stderr).toBeFalsy();

          const expectedOutput = readFileSync(
            './src/__test__/testdata/E2E/expected_output.txt',
          ).toString();
          writeFileSync('output.txt', stdout);
          expect(stdout).toEqual(expectedOutput);
          done();
        } catch (err) {
          done(err);
        }
      },
    );
  });
});
