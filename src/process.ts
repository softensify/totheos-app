// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { Result } from './types.ts';
import { getAppInfo, GetAppInfoInput } from './methods/getAppInfo.ts';
import { throwError } from './methods/throwError.ts';
import { callPlugin, CallPluginInput } from './plugins/callPlugin.ts';
import { afterPlugin, beforePlugin, cleanupPlugin, getDenoPermissions, getExtensionFolderWithConflictResolution, PermissionsData, toDenoOptions } from "./permissions/Permissions.ts";
import { InputAdjustment } from "./permissions/Permission.ts";
import { isHttpOrHttps, isObject } from "./util/types.ts";
import { update } from "./update/update.ts";
import { allPermissionsAreInList, checkPermissions, CheckPermissionsStatus, HtmlPermissions, PermissionsSet, removePluginPermission } from "./permissions/CheckPermissions.ts";
import { readManifest } from "./manifest/Manifest.ts";
import { existsSync } from "https://deno.land/std@0.113.0/fs/exists.ts";
import { isFileInExtension } from "./methods/isFileInExtension.ts";

function resultFail(error: string): ResultFail {
	return { success: false, error };
}

export const ON_UNDEFINED = resultFail('Not correct message format');
export const NO_INTERNAL = resultFail('Not correct message format, internal object missed');
export const NO_PATH = resultFail('Expect first argument to be browser data path');
export const NO_EXTENSION = resultFail('No extension attribute');
export const NO_PERMISSIONS = resultFail('Permissions were not requested');
export const METHOD_AND_PLUGIN_UNDEFINED = resultFail('Message should have method value or plugin value defined');
export const METHOD_NOT_FOUND = resultFail('Method not found');
export const PLUGIN_ERROR = resultFail('Plugin error');
export const REJECTED_ERROR = resultFail('Rejected by user');
export const NO_PROFILE = resultFail('No profile attribute');
export const NO_VERSION = resultFail('No version attribute');
export const NO_MANIFEST = resultFail('File totheos.json not found');
export const NOT_ALL_IN_MANIFEST = resultFail('Not all requested permissions are listed in totheos.json file');
export const NO_BROWSER = resultFail('No browser attribute');

const METHODS = {
    updateApp,
    getAppInfo,
    throwError,
    isFileInExtension,
};

export interface PermissionInput extends HtmlPermissions {
    readonly [id: string]: string;
}

export interface Internal {
    readonly extension: string;
    // todo: readonly
    path: string;
    readonly profile: string;
    // todo: readonly
    uuid: string;
    readonly version: string;
    readonly browser: string;
}

export interface Input extends PermissionsSet {
    readonly method?: keyof typeof METHODS;
    readonly plugin?: string;
    // todo: readonly
    internal: Partial<Internal>;
    readonly version?: string;
    readonly parameters?: {
        // deno-lint-ignore no-explicit-any
        [key: string]: any;
    };
}

export interface UpdateInput {
    readonly url: string;
}

export function updateApp(input: UpdateInput & GetAppInfoInput): Promise<Result> {
	return update(input.url);
}

export async function process<T, R>(input: (T & Input) | undefined, path: string, uuid: string): Promise<R & Result> {
	if (input === undefined) {
		return ON_UNDEFINED;
	}

	if (input.internal === undefined) {
		input.internal = {};
    }

	if (!isObject(input.internal)) {
        return NO_INTERNAL;
    }

    if (path === undefined || !Deno.statSync(path).isDirectory) {
        return NO_PATH;
    }

    input.internal.path = path;
    input.internal.uuid = uuid;

	if (input.method !== undefined) {
		if (Object.keys(METHODS).indexOf(input.method) === -1) {
			return METHOD_NOT_FOUND;
		} else {
			try {
				// deno-lint-ignore no-explicit-any
				return Object.assign({ success: true }, await METHODS[input.method](input as unknown as any));
			} catch (e) {
				return { success: false, error: e.message };
			}
		}
	}

	if (input.plugin !== undefined) {

		if (input.internal.extension === undefined) {
            return NO_EXTENSION;
        }

		if (input.internal.profile === undefined) {
			return NO_PROFILE;
		}

		if (input.internal.version === undefined) {
			return NO_VERSION;
		}

		if (input.internal.browser === undefined) {
			return NO_BROWSER;
		}

		if (
            input.permissions === undefined ||
            !Array.isArray(input.permissions) ||
            removePluginPermission(input.permissions).length === 0
        ) {
            return NO_PERMISSIONS;
        }

		try {
			let remote;

			if (!isHttpOrHttps(input.internal.extension)) {
				const extensionFolder = getExtensionFolderWithConflictResolution(input.internal as Internal, '../../links/');
				
				const manifestFile = extensionFolder + '/totheos.json';

				if (!existsSync(manifestFile)) {
					return NO_MANIFEST;
				}

				const manifest = readManifest(manifestFile);
				
				if (!allPermissionsAreInList(input.permissions, manifest.permissions)) {
					return NOT_ALL_IN_MANIFEST;
				}

				remote = manifest.remote;
			} else {
				remote = true;
			}

			const checkPermissionsResult = checkPermissions(input);
			if (checkPermissionsResult.status === CheckPermissionsStatus.Ask) {
				return {
                    success: true,
                    internal: {
                        command: 'ask',
                        htmlGranted: checkPermissionsResult.htmlGranted,
                        htmlAsk: checkPermissionsResult.htmlAsk,
                        permissions: checkPermissionsResult.permissions,
                    },
                };
			} else if (checkPermissionsResult.status === CheckPermissionsStatus.Rejected) {
				return REJECTED_ERROR;
			} else {
				const callPluginInput = input as CallPluginInput;
				const parameters: InputAdjustment = input.parameters === undefined ? {} : input.parameters;
				const data = new PermissionsData();
				beforePlugin(callPluginInput, parameters, data);
				const denoPermissions = getDenoPermissions(callPluginInput, parameters, data);
				const denoOptions = toDenoOptions(denoPermissions);
				const inputWithAdjustment = Object.assign({}, callPluginInput, { parameters });
				const result = await callPlugin(inputWithAdjustment, denoOptions, remote);
				afterPlugin(callPluginInput, parameters, data);
				cleanupPlugin(callPluginInput, parameters, data);
				return result;
			}
		} catch (e) {
			console.error(e.message);
			console.error(e);
			return Object.assign({}, PLUGIN_ERROR, { exception: e.message });
		}
	}

	return METHOD_AND_PLUGIN_UNDEFINED;
}
