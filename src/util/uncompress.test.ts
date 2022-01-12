// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { beforeEach, afterEach, describe, it } from 'https://deno.land/x/test_suite@0.9.0/mod.ts';
import { assertEquals, assertThrows } from 'https://deno.land/std@0.113.0/testing/asserts.ts';
import { uncompress } from './uncompress.ts';
import { getFilesList } from './files.ts';

describe('uncompress', () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = Deno.makeTempDirSync();
    });

    afterEach(() => Deno.removeSync(tempDir, { recursive: true }));

    it('correct.zip', () => {
        uncompress('src/util/uncompress/correct.zip', tempDir);
        assertEquals(getFilesList(tempDir), ['correct.txt']);
        assertEquals(Deno.readTextFileSync(`${tempDir}/correct.txt`), 'correct');
    });

    it('withSubFolder.zip', () => {
        uncompress('src/util/uncompress/withSubFolder.zip', tempDir);
        assertEquals(getFilesList(`${tempDir}/SubFolder`), ['correct.txt']);
        assertEquals(Deno.readTextFileSync(`${tempDir}/SubFolder/correct.txt`), 'correct');
    });

    it('not exists', () => {
        assertThrows(
            () => uncompress('src/util/uncompress/not_exists.zip', tempDir),
            Error,
            'No such file or directory (os error 2)'
        );
        assertEquals(getFilesList(tempDir), []);
    });

    it('not a zip file', () => {
        assertThrows(() => uncompress('src/util/uncompress.ts', tempDir), Error, `invalid zip data`);
        assertEquals(getFilesList(tempDir), []);
    });
});
