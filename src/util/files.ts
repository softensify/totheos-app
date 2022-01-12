// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { walkSync } from 'https://deno.land/std@0.113.0/fs/walk.ts';

const DOT = '.';
const NOT_VALID_CHARS = '/:*?"<>|';
const NOT_VALID_NAMES = ['..'];

export type ForFileCallback = (from: string, to: string) => boolean;
export type ForFileDenoCallback = (from: string, to: string) => void;

export function getFilesList(dir: string): string[] {
    const result: string[] = [];
    for (const dirEntry of Deno.readDirSync(dir)) {
        result.push(dirEntry.name);
    }
    return result;
}

export function getFilesRecursive(dir: string): string[] {
    const result: string[] = [];
    for (const e of walkSync(dir)) {
        result.push(e.path);
    }
    return result;
}

export function removeRoot(files: string[]): string[] {
    let root: string | undefined = undefined;
    const result: string[] = [];
    for (const path of files) {
        if (root == undefined) {
            root = appendSlash(path);
        } else {
            result.push(path.substr(root.length));
        }
    }
    return result;
}

export function isExtension(fileName: string, extension: string): boolean {
    return fileName.endsWith(DOT + extension);
}

function appendSlash(folder: string): string {
    return folder.endsWith('/') ? folder : (folder + '/');
}

function forFiles(
    fileNames: string[],
    fromFolder: string,
    toFolder: string,
    callback: ForFileCallback
): boolean {
    return (
        fileNames.find(
            (fileName) =>
                !callback(
                    appendSlash(fromFolder) + fileName,
                    appendSlash(toFolder) + fileName
                )
        ) === undefined
    );
}

export function exists(path: string): boolean {
    try {
        Deno.statSync(path);
        return true;
    } catch (_e) {
        return false;
    }
}

function createFolderOr(
    from: string,
    to: string,
    callback: ForFileDenoCallback
): boolean {
    try {
        if (Deno.statSync(from).isDirectory) {
            if (!exists(to) || !Deno.statSync(to).isDirectory) {
                Deno.mkdirSync(to);
            }
        } else {
            callback(from, to);
        }
    } catch (e) {
        console.error(e.message);
        return false;
    }
    return true;
}

export function copyFiles(
    fileNames: string[],
    fromFolder: string,
    toFolder: string
): boolean {
    return forFiles(
        fileNames,
        fromFolder,
        toFolder,
        (from, to) => createFolderOr(from, to, Deno.copyFileSync)
    );
}

export function moveFiles(
    fileNames: string[],
    fromFolder: string,
    toFolder: string
): boolean {
    return forFiles(
        fileNames,
        fromFolder,
        toFolder,
        (from, to) => createFolderOr(from, to, Deno.renameSync)
    );
}

export function isNameValid(name: string): boolean {
    const anyNotVaidChars = NOT_VALID_CHARS.split('').find((notVaidChar) => name.indexOf(notVaidChar) !== -1) !== undefined;
    const anyNotVaidNames = NOT_VALID_NAMES.find((notVaidChar) => name.indexOf(notVaidChar) !== -1) !== undefined;
    return !anyNotVaidChars && !anyNotVaidNames;
}

export function goUp(path: string, n: number): string | undefined {
    let result: string | undefined = path;
    while (n > 0 && result !== undefined) {
        result = goUpOne(result);
        n--;
    }
    return result;
}

export function goUpOne(path: string, isWindows: boolean = Deno.build.os === 'windows'): string | undefined {
    const slash = isWindows ? '\\' : '/';
    const lastSlash = path.lastIndexOf(slash);
    return lastSlash === -1 ? undefined : path.substr(0, lastSlash);
}
