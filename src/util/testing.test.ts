// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { describe, it } from 'https://deno.land/x/test_suite@0.9.0/mod.ts';
import { assert, assertEquals, assertThrows } from 'https://deno.land/std@0.113.0/testing/asserts.ts';
import { file, readToBuffer } from './testing.ts';

const CORRECT_TXT = 'correct.txt';
const OTHER_TXT = 'other.txt';
const TEST_TS = '.test.ts';
const TS = '.ts';
const FILE = 'file://';

describe('testing', () => {
    describe('file', () => {
        it('correct.txt', () => assertEquals(Deno.readTextFileSync(file(import.meta.url, CORRECT_TXT)), 'correct'));

        it('other.txt', () => {
            const correctName = file(import.meta.url, CORRECT_TXT);
            const otherName = file(import.meta.url, OTHER_TXT);

            assert(correctName.endsWith(CORRECT_TXT));
            assert(otherName.endsWith(OTHER_TXT));

            const correctPath = correctName.substr(0, correctName.length - CORRECT_TXT.length);
            const otherPath = otherName.substr(0, otherName.length - OTHER_TXT.length);

            assertEquals(correctPath, otherPath);
        });

        it('no test.ts suffix', () => {
            const url = import.meta.url;
            assert(url.endsWith(TEST_TS));
            const withoutSuffix = url.substr(0, url.length - TEST_TS.length) + TS;
            assertThrows(() => file(withoutSuffix, CORRECT_TXT), Error);
        });

        it('no file:// proefix', () => {
            const url = import.meta.url;
            assert(url.startsWith(FILE));
            const withoutPrefix = url.substr(FILE.length);
            assertThrows(() => file(withoutPrefix, CORRECT_TXT), Error);
        });
    });

    describe('readToBuffer', () => {
        it('correct.txt', () => assertEquals(new TextDecoder().decode(readToBuffer(file(import.meta.url, CORRECT_TXT))), 'correct'));
        it('folder', () => assertThrows(() => readToBuffer(file(import.meta.url, '')), Error, 'Not a file'));
        it('not exists', () => assertThrows(() => readToBuffer(file(import.meta.url, 'not_exists.txt')), Error));
    });
});