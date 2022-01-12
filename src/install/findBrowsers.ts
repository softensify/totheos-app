// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { exists, goUp } from "../util/files.ts";
import { resolve } from 'https://deno.land/std@0.113.0/path/mod.ts';
import { existsSync } from 'https://deno.land/std@0.113.0/fs/exists.ts';
import { expandGlobSync } from "https://deno.land/std@0.113.0/fs/expand_glob.ts";

export type SupportedOS = 'darwin' | 'linux' | 'windows';

export type LinkJson = (findBrowserResult: FindBrowserResult, jsonFilePath: string, nativeHost: string) => Promise<string>;

export interface BrowserLocation {
    name: string;
    profiles: string;
    link: string;
    type: string;
}

export interface FindBrowserOptions {
    globs: string[];
    browsers: BrowserLocation[];
    goUp: number;
    configDir: string;
    linkJson: LinkJson;
    userFolderVariable: string;
    os: string;
}

type GetFindBrowserOptions = (userFolder: string) => FindBrowserOptions;

export interface FindBrowserResult {
    profiles: string;
    browser: string;
    link: string;
    type: string;
}

interface StarsWithCount {
	stars: string;
	count: number;
}

const STARS: StarsWithCount[] = [
    { stars: '*\\*', count: 2 },
    { stars: '*/*', count: 2 },
    { stars: '*', count: 1 },
];

export const OPTIONS_BY_OS: { [key in SupportedOS]: GetFindBrowserOptions } = {
    darwin: (userFolder) => {
        return {
            os: 'macOS',
            userFolderVariable: '$HOME',
            globs: [
                `${userFolder}/Library/Application Support/*/*/NativeMessagingHosts`,
                `${userFolder}/Library/Application Support/*/NativeMessagingHosts`,
            ],
            browsers: [
                {
                    name: 'Google Chrome',
                    link: `${userFolder}/Library/Application Support/Google/Chrome/NativeMessagingHosts`,
                    profiles: `${userFolder}/Library/Application Support/Google/Chrome`,
                    type: 'chrome',
                },
                {
                    name: 'Avast Secure Browser Beta',
                    link: `${userFolder}/Library/Application Support/Avast Software/Browser Beta/NativeMessagingHosts`,
                    profiles: `${userFolder}/Library/Application Support/Avast Software/Browser Beta`,
                    type: 'chrome',
                },
                {
                    name: 'Microsoft Edge Beta',
                    link: `${userFolder}/Library/Application Support/Microsoft Edge Beta/NativeMessagingHosts`,
                    profiles: `${userFolder}/Library/Application Support/Microsoft Edge Beta`,
                    type: 'chrome',
                },
                {
                    name: 'Vivaldi',
                    link: `${userFolder}/Library/Application Support/Vivaldi/NativeMessagingHosts`,
                    profiles: `${userFolder}/Library/Application Support/Vivaldi`,
                    type: 'chrome',
                },
                {
                    name: 'Brave',
                    link: `${userFolder}/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts`,
                    profiles: `${userFolder}/Library/Application Support/BraveSoftware/Brave-Browser`,
                    type: 'chrome',
                },
                {
                    name: 'Firefox',
                    link: `${userFolder}/Library/Application Support/Mozilla/NativeMessagingHosts`,
                    profiles: `${userFolder}/Library/Application Support/Mozilla/Profiles`,
                    type: 'firefox',
                },
            ],
            goUp: 1,
            configDir: `${userFolder}/Library/Application Support`,
            linkJson: linkJsonSoftLink,
        };
    },

    windows: (userFolder) => {
        return {
            os: 'Windows',
            userFolderVariable: '%LOCALAPPDATA%',
            globs: [`${userFolder}\\*\\*\\User Data\\*\\Cache`, `${userFolder}\\*\\User Data\\*\\Cache`],
            browsers: [
                {
                    name: 'Google Chrome',
                    link: 'HKEY_CURRENT_USER\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts',
                    profiles: `${userFolder}\\Google\\Chrome\\User Data`,
                    type: 'chrome',
                },
                {
                    name: 'Comodo Dragon',
                    link: 'HKEY_CURRENT_USER\\SOFTWARE\\Comodo\\Dragon\\NativeMessagingHosts',
                    profiles: `${userFolder}\\Comodo\\Dragon\\User Data`,
                    type: 'chrome',
                },
                {
                    name: 'Microsoft Edge',
                    link: 'HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Edge\\NativeMessagingHosts',
                    profiles: `${userFolder}\\Microsoft\\Edge\\User Data`,
                    type: 'chrome',
                },
                {
                    name: 'Vivaldi',
                    link: 'HKEY_CURRENT_USER\\SOFTWARE\\Vivaldi\\NativeMessagingHosts',
                    profiles: `${userFolder}\\Vivaldi\\User Data`,
                    type: 'chrome',
                },
                {
                    name: 'Brave',
                    link: 'HKEY_CURRENT_USER\\SOFTWARE\\Chromium\\NativeMessagingHosts',
                    profiles: `${userFolder}\\BraveSoftware\\Brave-Browser\\User Data`,
                    type: 'chrome',
                },
            ],
            goUp: 2,
            configDir: `${userFolder}\\AppData\\Local`,
            linkJson: linkJsonWindowsRegistry,
        };
    },

    linux: (userFolder) => {
        return {
            os: 'Linux',
            userFolderVariable: '$HOME',
            globs: [
                `${userFolder}/.config/*/NativeMessagingHosts`,
                `${userFolder}/.config/*/*/NativeMessagingHosts`,
            ],
            browsers: [
                {
                    name: 'Firefox',
                    link: `${userFolder}/.mozilla/native-messaging-hosts`,
                    profiles: `${userFolder}/.mozilla/firefox`,
                    type: 'firefox',
                },
                {
                    name: 'Firefox ESR',
                    link: `${userFolder}/.mozilla/native-messaging-hosts`,
                    profiles: `${userFolder}/.mozilla/firefox-esr`,
                    type: 'firefox',
                },
                {
                    name: 'Firefox Trunk',
                    link: `${userFolder}/.mozilla/native-messaging-hosts`,
                    profiles: `${userFolder}/.mozilla/firefox-trunk`,
                    type: 'firefox',
                },
            ],
            goUp: 1,
            configDir: `${userFolder}/.config`,
            linkJson: linkJsonSoftLink,
        };
    },
};

export function getOptions(os: SupportedOS, userFolder: string): FindBrowserOptions {
	return OPTIONS_BY_OS[os](userFolder);
}

export function findBrowser(findBrowserOptions: FindBrowserOptions): FindBrowserResult[] {
	return findBrowserOptions.globs
        .flatMap((glob) => findBrowserOneGlob(glob, findBrowserOptions.goUp))
        .concat(findBrowserOptions.browsers.flatMap((browser) => findByBrowserOnePath(browser)));
}

function findBrowserOneGlob(glob: string, n: number): FindBrowserResult[] {
    try {
        return Array.from(expandGlobSync(glob))
            .filter((walk) => walk.isDirectory)
            .map((walk) => walk.path)
            .map((path) => pathToResult(glob, path, n))
            .filter((result) => result !== undefined) as FindBrowserResult[];
    } catch (e) {
        console.error(e.message);
        return [];
    }
}

function findByBrowserOnePath(browserLocation: BrowserLocation): FindBrowserResult[] {
    return exists(browserLocation.profiles)
        ? [
              {
                  profiles: browserLocation.profiles,
                  browser: browserLocation.name,
                  link: browserLocation.link,
                  type: browserLocation.type,
              },
          ]
        : [];
}

function pathToResult(glob: string, path: string, n: number): FindBrowserResult | undefined {
	return STARS
		.map((star) => {
            const index = glob.indexOf(star.stars);
            const browserPath = goUp(path, n);
            return index === -1 || browserPath === undefined
                ? undefined
                : {
                      profiles: browserPath,
                      browser: getFolders(path.substr(index), star.count),
                      link: browserPath + '/NativeMessagingHosts',
                      type: 'chrome',
                  };
        })
		.filter((record) => record !== undefined)
		.find(() => true);
}

function getFolders(path: string, n: number): string {
    const slash = Deno.build.os === 'windows' ? '\\' : '/';
	return path.split(slash).slice(0, n).join(slash);
}

export function linkJsonSoftLink(findBrowserResult: FindBrowserResult, jsonFilePath: string, nativeHost: string): Promise<string> {
    if (Deno.build.os === 'windows') {
        throw new Error(`${Deno.build.os} is not supported`);
    }

    try {
        Deno.mkdirSync(findBrowserResult.link);
    } catch (_e) {
        // ignore
    }

	const linkFile = findBrowserResult.link + '/' + nativeHost + '.json';

    if (existsSync(linkFile)) {
        Deno.removeSync(linkFile);
        console.log(`Link file ${linkFile} removed`);
    }

	Deno.symlinkSync(resolve(jsonFilePath), linkFile);
    console.log(`Link file ${linkFile} created`);

    return Promise.resolve(linkFile);
}

async function linkJsonWindowsRegistry(
    findBrowserResult: FindBrowserResult,
    jsonFilePath: string,
    nativeHost: string
): Promise<string> {
    if (Deno.build.os !== 'windows') {
        throw new Error(`${Deno.build.os} is not supported`);
    }

    const keyName = `${findBrowserResult.link}\\${nativeHost}`;
    await windowsRegistryAdd(keyName, resolve(jsonFilePath));
    return keyName;
}

export async function windowsRegistryAdd(keyName: string, value: string): Promise<void> {
    const regFile = createRegFile(keyName, value);
	const result = await Deno.run({
        cmd: ['cmd', '/c', 'reg', 'import', regFile],
        stdout: 'piped',
        stderr: 'piped',
    }).status();

    Deno.removeSync(regFile);

    if (!result.success) {
        throw new Error(`Error in executing 'reg import' command`);
    }
}

function createRegFile(keyName: string, value: string): string {
    const tempFile = Deno.makeTempFileSync();
    const content = `Windows Registry Editor Version 5.00\r\n\r\n[${keyName}]\r\n@="${value.replaceAll(
        '\\',
        '\\\\'
    )}"\n\n`;
    Deno.writeTextFileSync(tempFile, content);
    return tempFile;
}

export function getHomeFolder(os: SupportedOS, home: string | undefined, localAppData: string | undefined): string {
	const result = os === 'windows' ? localAppData : home;
	if (result === undefined) {
		throw new Error('Missed environment variable LOCALAPPDATA (Windows) or HOME (non-Windows)');
	} else {
		return result;
	}
}

export function filterNotInstalled(found: FindBrowserResult[], alreadyInstalledPaths: string[]): FindBrowserResult[] {
    return found.filter((record) => alreadyInstalledPaths.indexOf(record.profiles) === -1);
}
