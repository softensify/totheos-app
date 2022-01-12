// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { describe, it } from 'https://deno.land/x/test_suite@0.9.0/mod.ts';
import { assertEquals } from 'https://deno.land/std@0.113.0/testing/asserts.ts';
import { Input } from './process.ts';
import { Result } from './types.ts';
import { fromNative, toNative } from './util/nativeMessaging.ts';
import { VERSION } from './methods/getAppInfo.ts';

async function run<T, R>(input: (T & Input) | undefined): Promise<R & Result> {
	const p = Deno.run({
        cmd: [Deno.execPath(), 'run', '--allow-read', '--no-check', 'src/index.ts', 'message', '.', 'test-uuid'],
        stdout: 'piped',
        stdin: 'piped',
    });

	await p.stdin.write(toNative(input));
	p.stdin.close();
	const output = await p.output();
	p.close();
	const fileName = Deno.makeTempFileSync();
	Deno.writeFileSync(fileName, output);
	const file = Deno.openSync(fileName);
	const result = fromNative(file);
	Deno.removeSync(fileName);
	return result;
}

describe('index', () => {
	it('getAppInfo', async () => {
		const result = await run({
			method: 'getAppInfo',
			internal: { extension: 'abc', profile: 'Default' },
			granted: [],
			rejected: [],
		});
		assertEquals(result, { success: true, version: VERSION, os: Deno.build.os, uuid: 'test-uuid' });
	});
});
