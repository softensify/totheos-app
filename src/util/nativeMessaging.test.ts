// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { describe, it } from 'https://deno.land/x/test_suite@0.9.0/mod.ts';
import { assertEquals } from 'https://deno.land/std@0.113.0/testing/asserts.ts';
import { fromNative, toNative } from './nativeMessaging.ts';
import { file, readToBuffer } from './testing.ts';

describe('nativeMessaging', () => {
    describe('fromNative', () => {
        it('correct', () => assertEquals(fromNative(Deno.openSync(file(import.meta.url, 'correct.dat'))), { a: 1 }));
        it('size 0', () => assertEquals(fromNative(Deno.openSync(file(import.meta.url, 'size0.dat'))), undefined));
        it('size 1', () => assertEquals(fromNative(Deno.openSync(file(import.meta.url, 'size1.dat'))), undefined));
        it('size 2', () => assertEquals(fromNative(Deno.openSync(file(import.meta.url, 'size2.dat'))), undefined));
        it('size 3', () => assertEquals(fromNative(Deno.openSync(file(import.meta.url, 'size3.dat'))), undefined));
        it('size 4', () => assertEquals(fromNative(Deno.openSync(file(import.meta.url, 'size4.dat'))), undefined));
        it('size 5, value 0', () => assertEquals(fromNative(Deno.openSync(file(import.meta.url, 'size5value0.dat'))), undefined));
        it('size 5, value 1', () => assertEquals(fromNative(Deno.openSync(file(import.meta.url, 'size5value1.dat'))), undefined));
        it('size 5, value 2', () => assertEquals(fromNative(Deno.openSync(file(import.meta.url, 'size5value2.dat'))), undefined));
    });

    describe('toNative', () => {
        it('correct', () => assertEquals(toNative({ a: 1 }), readToBuffer(file(import.meta.url, 'correct.dat'))));
    });
});