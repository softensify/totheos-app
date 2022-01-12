// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { afterEach, beforeEach, describe, it } from 'https://deno.land/x/test_suite@0.9.0/mod.ts';
import { assertEquals } from 'https://deno.land/std@0.113.0/testing/asserts.ts';
import { Runnable } from '../util/types.ts';
import { findBrowser, FindBrowserOptions, FindBrowserResult, linkJsonSoftLink } from './findBrowsers.ts';

describe('findBrowsers', () => {

	let cleanups: Runnable[] = [];

	beforeEach(() => {
		cleanups = [];
	});

	afterEach(() => cleanups.reverse().forEach((cleanup) => cleanup()));

	function getExpect(temp: string): FindBrowserResult[] {
		return [
            {
                profiles: temp + '/.config/browser1',
                browser: 'browser1',
                link: temp + '/.config/browser1/NativeMessagingHosts',
                type: 'chrome',
            },
            {
                profiles: temp + '/.config/company/browser2',
                browser: 'company/browser2',
                link: temp + '/.config/company/browser2/NativeMessagingHosts',
                type: 'chrome',
            },
        ];
	}

	it('find, got up 1', () => {
		const temp = Deno.makeTempDirSync();
		cleanups.push(() => Deno.removeSync(temp, {recursive: true}));
		Deno.mkdirSync(temp + '/.config/browser1/NativeMessagingHosts', { recursive: true });
		Deno.mkdirSync(temp + '/.config/company/browser2/NativeMessagingHosts', { recursive: true });

		const findBrowserOptions: FindBrowserOptions = {
			os: 'Linux',
            userFolderVariable: '$HOME',
			globs: [
				temp + '/.config/*/NativeMessagingHosts',
				temp + '/.config/*/*/NativeMessagingHosts'
			],
			browsers: [],
			goUp: 1,
			configDir: '',
			linkJson: Promise.resolve,
        };

		assertEquals(findBrowser(findBrowserOptions), getExpect(temp));
	});

	it('find, got up 2', () => {
		const temp = Deno.makeTempDirSync();
		cleanups.push(() => Deno.removeSync(temp, {recursive: true}));
		Deno.mkdirSync(temp + '/.config/browser1/Default/Cache', { recursive: true });
        Deno.mkdirSync(temp + '/.config/company/browser2/Default/Cache', { recursive: true });

		const findBrowserOptions: FindBrowserOptions = {
			os: 'Linux',
            userFolderVariable: '$HOME',
            globs: [
                temp + '/.config/*/Default/Cache',
                temp + '/.config/*/*/Default/Cache',
            ],
			browsers: [],
			goUp: 2,
			configDir: '',
			linkJson: Promise.resolve,
        };

		assertEquals(findBrowser(findBrowserOptions), getExpect(temp));
	});
});

const HOST_ID = 'native.com';

describe('linkJsonSoftLink', () => {

	let cleanups: Runnable[] = [];

    beforeEach(() => {
        cleanups = [];
    });

    afterEach(() => cleanups.reverse().forEach((cleanup) => cleanup()));

	it('success', () => {
		const jsonContent = '{"a": 1}';
		const temp = Deno.makeTempDirSync();
		cleanups.push(() => Deno.removeSync(temp, { recursive: true }));
		Deno.mkdirSync(temp + '/jsonFolder');
		Deno.writeTextFileSync(temp + '/jsonFolder/file.json', jsonContent);
		linkJsonSoftLink({ profiles: temp, browser: '', link: temp, type: 'chrome' }, temp + '/jsonFolder/file.json', HOST_ID);
		assertEquals(Deno.readTextFileSync(temp + '/native.com.json'), jsonContent);
    });
});
