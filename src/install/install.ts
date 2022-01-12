// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { resolve } from "https://deno.land/std@0.113.0/path/win32.ts";
import { Table } from 'https://deno.land/x/cliffy@v0.19.6/table/mod.ts';
import { notUndefined } from "../util/types.ts";

import {
    createBatchFile,
    createJsonManifestFile,
    createJsonDataFile,
    getAllInstalledBrowsersFolders,
    NativeMessagingManifestApp,
    PathWithUuid,
} from './createLinkFiles.ts';
import { filterNotInstalled, findBrowser, FindBrowserResult, getHomeFolder, getOptions, LinkJson, OPTIONS_BY_OS, windowsRegistryAdd } from './findBrowsers.ts';

const APP_FOLDER = '../..';
const APP: NativeMessagingManifestApp = {
    description: 'ToTheOS description',
};
const CHROME_EXTENSION_IDS = ['gmgmopkfjapfbmnjbndnpiagkdpfakdo'];
const FIREFOX_EXTENSION_IDS = ['firefox-extension-id'];
const NATIVE_HOST_ID = 'totheos.com';

export function installList(): void {
    const result = installListData();
    const table = new Table().header(['UUID', 'Path']).body(result.map((record) => [record.uuid, record.path]));
    console.log(table.toString());
}

export function installFind(): void {
    const result = installFindData();
    const table = new Table().header(['Browser', 'Path']).body(result.map((record) => [record.browser, record.profiles]));
    console.log(table.toString());
}

export function installAdd(type: string | undefined, path: string | undefined, link: string | undefined): void {

    const notCorrectType = type !== 'firefox' && type !== 'chrome';
	const noFolder = path === undefined;
	const noLink = link === undefined;

	if (notCorrectType) {
        console.error(`First parameter has to be 'firefox' or 'chrome'`);
    }

	if (noFolder) {
        console.error('No directory specified');
    }

	if (noLink) {
        console.error('No link directory specified');
	}
	
	if (notCorrectType || noFolder || noLink) {
        console.error('Usage on Windows: totheos firefox|chrome BROWSER-PATH WINDOWS-REGISTRY-KEY');
        console.error('Usage on Linux/Mac: ./totheos.sh firefox|chrome BROWSER-PATH LINK-PATH');
        Deno.exit(1);
    }

	const userFolder = getHomeFolder(Deno.build.os, Deno.env.get('HOME'), Deno.env.get('LOCALAPPDATA'));
    const record: FindBrowserResult = {
        profiles: path,
        browser: type,
        type: type,
        link,
    };

	const linkJsonOneWindows: LinkJson = (
		_findBrowserResult: FindBrowserResult,
		jsonFilePath: string,
		_nativeHost: string
	) => {
		if (Deno.build.os !== 'windows') {
			throw new Error(`${Deno.build.os} is not supported`);
		}

        windowsRegistryAdd(notUndefined(link), resolve(jsonFilePath));
        
        return Promise.resolve(notUndefined(link));
	};

	const options = Deno.build.os === 'windows' ? linkJsonOneWindows : getOptions(Deno.build.os, userFolder).linkJson;

	installOne(record, options);
}

export async function install(): Promise<void> {
    const userFolder = getHomeFolder(Deno.build.os, Deno.env.get('HOME'), Deno.env.get('LOCALAPPDATA'));
    const findData = installFindData();
    const listData = installListData();
    const toInstall = filterNotInstalled(
        findData,
        listData.map((record) => record.path)
	);
	const options = getOptions(Deno.build.os, userFolder);
    const result: InstallOneResult[] = [];
    for (const record of toInstall) {
        result.push(await installOne(record, options.linkJson));
    }
    const table = new Table().header(['Done', 'Path', 'Browser']).body(result);
    console.log(table.toString());
}

type InstallOneResult = [
	'Success' | 'Fail',
	string,
	string
];

async function installOne(record: FindBrowserResult, linkJson: LinkJson): Promise<InstallOneResult> {
    let done;

    try {
        const uuid = crypto.randomUUID();
        const batchFile = createBatchFile(Deno.build.os, uuid, APP_FOLDER, record.profiles);
        const jsonFile = createJsonManifestFile(
            uuid,
            APP_FOLDER,
            APP,
            NATIVE_HOST_ID,
            batchFile,
            CHROME_EXTENSION_IDS,
            FIREFOX_EXTENSION_IDS,
            record.type
        );
        const link = await linkJson(record, jsonFile, NATIVE_HOST_ID);
        createJsonDataFile(uuid, APP_FOLDER, { path: record.profiles, link });
        done = true;
    } catch (_e) {
        done = false;
    }

    return Promise.resolve([done ? 'Success' : 'Fail', record.profiles, record.browser]);
}

function installFindData(): FindBrowserResult[] {
    const userFolder = getHomeFolder(Deno.build.os, Deno.env.get('HOME'), Deno.env.get('LOCALAPPDATA'));
    return findBrowser(getOptions(Deno.build.os, userFolder));
}

function installListData(): PathWithUuid[] {
    return getAllInstalledBrowsersFolders(APP_FOLDER);
}

export function installRules(): void {
    Object.values(OPTIONS_BY_OS).forEach((func) => {
        const recordToGetDetails = func('');
        console.log(`${recordToGetDetails.os}:`);
        const record = func(recordToGetDetails.userFolderVariable);
        record.browsers.forEach((browser) => {
            console.log(`Browser Name: ${browser.name}`);
            console.log(`  Browser Location: ${browser.profiles}`);
            console.log(`  Link directory/registry: ${browser.link}`);
        });
        console.log('Also checks:');
        record.globs.forEach((glob) => console.log(`  ${glob}`));
        console.log();
    });
}
