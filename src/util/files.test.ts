// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { afterEach, beforeEach, describe, it } from 'https://deno.land/x/test_suite@0.9.0/mod.ts';
import { assert, assertEquals } from 'https://deno.land/std@0.113.0/testing/asserts.ts';
import { file } from './testing.ts';
import { copyFiles, getFilesRecursive, goUpOne, isExtension, moveFiles, removeRoot } from './files.ts';

describe('files', () => {
    describe('getFilesRecursive', () => {
        it('correct', () =>
            assertEquals(removeRoot(getFilesRecursive(file(import.meta.url))), [
                'folder',
                'folder/3.txt',
                '1.txt',
                '2.txt',
            ]));
    });

    describe('isExtension', () => {
        it('correct', () => assert(isExtension('test.txt', 'txt')));
        it('not correct', () => assert(!isExtension('test.txt', 'png')));
    });

    describe('copyFiles', () => {
        let tempDir: string;
        let tempFile: string;

        beforeEach(() => {
            tempDir = Deno.makeTempDirSync();
            tempFile = Deno.makeTempFileSync();
        });

        afterEach(() => {
            Deno.removeSync(tempDir, { recursive: true });
            Deno.removeSync(tempFile);
        });

        it('correct', () => {
            const sourceFiles = removeRoot(getFilesRecursive(file(import.meta.url)));
            const result = copyFiles(sourceFiles, file(import.meta.url), tempDir);
            assert(result);
            const targetFiles = removeRoot(getFilesRecursive(tempDir));
            assertEquals(targetFiles, ['folder', 'folder/3.txt', '1.txt', '2.txt']);
        });

        it('overwrite', () => {
            const sourceFiles = removeRoot(getFilesRecursive(file(import.meta.url)));
            const result = copyFiles(sourceFiles, file(import.meta.url), tempDir);
            assert(result);
            const targetFiles = removeRoot(getFilesRecursive(tempDir));
            assertEquals(targetFiles, ['folder', 'folder/3.txt', '1.txt', '2.txt']);
        });

        it('not exists', () => {
            const sourceFiles = [file(import.meta.url, 'not_exists.txt')];
            const result = copyFiles(sourceFiles, file(import.meta.url), tempDir);
            assert(!result);
        });

        it('to file', () => {
            const sourceFiles = removeRoot(getFilesRecursive(file(import.meta.url)));
            const result = copyFiles(sourceFiles, file(import.meta.url), tempFile);
            assert(!result);
        });
    });

    describe('moveFiles', () => {
        let tempDir1: string;
        let tempDir2: string;
        let tempFile: string;

        beforeEach(() => {
            tempDir1 = Deno.makeTempDirSync();
            tempDir2 = Deno.makeTempDirSync();
            tempFile = Deno.makeTempFileSync();
        });

        afterEach(() => {
            Deno.removeSync(tempDir1, { recursive: true });
            Deno.removeSync(tempDir2, { recursive: true });
            Deno.removeSync(tempFile);
        });

        it('correct', () => {
            const sourceFiles = removeRoot(getFilesRecursive(file(import.meta.url)));
            const result1 = copyFiles(sourceFiles, file(import.meta.url), tempDir1);
            assert(result1);
            const result2 = moveFiles(sourceFiles, tempDir1, tempDir2);
            assert(result2);
            const result3 = copyFiles(sourceFiles, file(import.meta.url), tempDir1);
            assert(result3);
            const result4 = moveFiles(sourceFiles, tempDir1, tempDir2);
            assert(result4);

            const tempFiles = removeRoot(getFilesRecursive(tempDir1));
            assertEquals(tempFiles, ['folder']);

            const targetFiles = removeRoot(getFilesRecursive(tempDir2));
            assertEquals(targetFiles, ['folder', 'folder/3.txt', '1.txt', '2.txt']);
        });

        it('overwrite', () => {
            const sourceFiles = removeRoot(getFilesRecursive(file(import.meta.url)));
            const result1 = copyFiles(sourceFiles, file(import.meta.url), tempDir1);
            assert(result1);
            const result2 = moveFiles(sourceFiles, tempDir1, tempDir2);
            assert(result2);
            const result3 = copyFiles(sourceFiles, file(import.meta.url), tempDir1);
            assert(result3);
            const result4 = moveFiles(sourceFiles, tempDir1, tempDir2);
            assert(result4);

            const tempFiles = removeRoot(getFilesRecursive(tempDir1));
            assertEquals(tempFiles, ['folder']);

            const targetFiles = removeRoot(getFilesRecursive(tempDir2));
            assertEquals(targetFiles, ['folder', 'folder/3.txt', '1.txt', '2.txt']);
        });

        it('not exists', () => {
            const sourceFiles = [file(import.meta.url, 'not_exists.txt')];
            const result = moveFiles(sourceFiles, file(import.meta.url), tempDir1);
            assert(!result);
        });

        it('to file', () => {
            const sourceFiles = removeRoot(getFilesRecursive(file(import.meta.url)));
            const result = moveFiles(sourceFiles, file(import.meta.url), tempFile);
            assert(!result);
        });
    });

    it('goUpOne', () => {
        assertEquals(goUpOne('/abc/def'), '/abc');
        assertEquals(goUpOne('c:\\abc\\def', true), 'c:\\abc');
        assertEquals(goUpOne('/abc'), '');
        assertEquals(goUpOne('\\abc', true), '');
        assertEquals(goUpOne('c:\\abc', true), 'c:'); // todo: is this correct?
        assertEquals(goUpOne('abc'), undefined);
        assertEquals(goUpOne('abc', true), undefined);
    });
});