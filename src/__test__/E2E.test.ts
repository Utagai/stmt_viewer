import { exec } from 'child_process';
import { readFileSync } from 'fs';

// Set the timeout for 10 seconds, since this test often takes about 5~ seconds.
jest.setTimeout(10 * 1000);

describe('e2e', () => {
  test('prints correct report without error', (done) => {
    exec(
      'npm run start -- ./src/__test__/testdata/E2E/test.yml ./src/__test__/testdata/E2E/test.csv',
      (error, stdout, _) => {
        try {
          expect(error).toBeFalsy();

          // NOTE: This test might be brittle. I'm not sure if some of the
          // content, namely at the top of the expected output file changes
          // based on the developer's machine.
          // NOTE: Ideally, I'd want the expected_output.txt file to contain
          // color, but for some reason, it doesn't contain it. It used to
          // contain it when I first wrote the test, but now it doesn't. I'm not
          // sure why. I'll just remove the color from the expected output file
          // for now, especially because Print.test.ts should be testing this
          // already.
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
