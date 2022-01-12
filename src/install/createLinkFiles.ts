// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { expandGlobSync } from 'https://deno.land/std@0.113.0/fs/expand_glob.ts';
import { basename } from 'https://deno.land/std@0.113.0/path/mod.ts';
import { SupportedOS } from "./findBrowsers.ts";
import { resolve } from 'https://deno.land/std@0.113.0/path/mod.ts';

export type BrowserType = 'firefox' | 'chrome';

export interface NativeMessagingManifestApp {
    description: string;
}

interface NativeMessagingManifestConst {
	type: 'stdio';
}

const NATIVE_MESSAGING_MANIFESTS_CONST: NativeMessagingManifestConst = { type: 'stdio' };

export interface NativeMessagingManifestParameters {
	readonly name: string;
    readonly path: string;
    readonly "allowed_extensions"?: string[];
    readonly "allowed_origins"?: string[];
}

interface NativeMessagingManifest extends NativeMessagingManifestApp, NativeMessagingManifestConst, NativeMessagingManifestParameters {
}

export interface PathWithUuid {
	uuid: string;
	path: string;
}

export interface LinkData {
	path: string;
	link: string;
}

export function createJsonDataFile(uuid: string, appFolder: string, data: LinkData): string {
    const fileName = `${appFolder}/links/${uuid}.json`;
    Deno.writeTextFileSync(fileName, JSON.stringify(data));
    return fileName;
}

export function createCmdFile(uuid: string, appFolder: string, profilesFolder: string): string {
	const content = `@echo off\r\n\r\nRem Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.\r\n\r\ncd /D "%~dp0"\r\n@..\\totheos.cmd message "${profilesFolder}" ${uuid}`;
	const fileName = `${appFolder}/links/${uuid}.cmd`;
	Deno.writeTextFileSync(fileName, content);
	return fileName;
}

export function createShFile(uuid: string, appFolder: string, profilesFolder: string): string {
    const content = `#!/bin/bash\n\n# Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.\n\ncd \`dirname "$0"\`\n../totheos.sh message '${profilesFolder}' ${uuid}`;
    const fileName = `${appFolder}/links/${uuid}.sh`;
    Deno.writeTextFileSync(fileName, content);
    Deno.chmodSync(fileName, 0o775);
    return fileName;
}

export function createBatchFile(os: SupportedOS, uuid: string, appFolder: string, browserFolder: string): string {
	return os === 'windows'
        ? createCmdFile(uuid, appFolder, browserFolder)
        : createShFile(uuid, appFolder, browserFolder);
}

export function createJsonManifestFile(
	uuid: string,
	appFolder: string,
	app: NativeMessagingManifestApp,
	nativeHost: string,
	batchFile: string,
	chromeExtensionIds: string[],
	firefoxExtensionIds: string[],
	browser: string,
): string {

	const browserSpecific = browser === 'firefox'
		? { "allowed_extensions": firefoxExtensionIds }
		: { "allowed_origins": chromeExtensionIdsToAllowedOrigins(chromeExtensionIds) };

	const parameters: NativeMessagingManifestParameters = Object.assign(
		{},
		{ name: nativeHost, path: resolve(batchFile) },
        browserSpecific
	);

	const content: NativeMessagingManifest = Object.assign({}, app, NATIVE_MESSAGING_MANIFESTS_CONST, parameters);
	const folder = `${appFolder}/links/${uuid}`;
	Deno.mkdirSync(folder);
    const fileName = `${folder}/${nativeHost}.json`;
    Deno.writeTextFileSync(fileName, JSON.stringify(content));
    return fileName;
}

function chromeExtensionIdsToAllowedOrigins(chromeExtensionIds: string[]): string[] {
	return chromeExtensionIds.map((id) => `chrome-extension://${id}/`);
}

export function getAllInstalledBrowsersFolders(appFolder: string): PathWithUuid[] {
	return Array.from(expandGlobSync(`${appFolder}/links/*.json`))
        .filter((walk) => walk.isFile)
        .map((walk) => walk.path)
        .map((path) => {
            const content = Deno.readTextFileSync(path);
            const json: LinkData = JSON.parse(content);
            return {
                path: json.path,
                uuid: basename(path).replace(/\.json$/, ''),
            };
        });
}
