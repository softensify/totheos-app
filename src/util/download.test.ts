// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import * as mf from 'https://deno.land/x/mock_fetch@0.2.0/mod.ts';
import { describe, it } from 'https://deno.land/x/test_suite@0.9.0/mod.ts';
import { assertEquals, assertThrowsAsync } from 'https://deno.land/std@0.113.0/testing/asserts.ts';
import { download } from './download.ts';
import { Producer } from './types.ts';

const correctTxtContent = 'correct';
mf.install();
mf.mock('GET@/correct.txt', () => new Response(correctTxtContent, { status: 200 }));
mf.mock('GET@/correct.txt', () => new Response(correctTxtContent, { status: 200 }));
mf.mock('GET@/not_found.txt', () => new Response('', { status: 404 }));

async function successTest(url: string): Promise<void> {
  const fileName = await download(url);
  const content = Deno.readTextFileSync(fileName);
  Deno.removeSync(fileName);
  assertEquals(content, correctTxtContent);
}

async function failTest(url: string, errorMessage: string, fileNameProducer?: Producer<string>): Promise<void> {
  let fileName;
  await assertThrowsAsync(
    async () => {
      fileName = fileNameProducer === undefined ? await download(url) : await download(url, fileNameProducer);
    },
    Error,
    errorMessage
  );
  assertEquals(fileName, undefined);
}

describe('download', () => {
  it('https correct.txt', () => successTest('https://test.com/correct.txt'));
  it('http correct.txt', () => successTest('http://test.com/correct.txt'));

  it('not found', () => failTest('https://test.com/not_found.txt', 'status 404-\'\' received instead of 200'));
  it('not correct url', () => failTest('not_correct', 'Invalid URL'));
  it('target locaton is folder', () => failTest('http://test.com/correct.txt', 'Is a directory (os error 21)', () => '/tmp'));
});
