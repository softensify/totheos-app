// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { CallPluginInput } from '../plugins/callPlugin.ts';
import { Runnable, undefinedToValue } from '../util/types.ts';
import { Internal, PermissionInput } from '../process.ts';
import { DenoPermissions, InputAdjustment, Permission, DENO_PERMISSIONS_EMPTY } from './Permission.ts';
import { exists, isNameValid } from "../util/files.ts";
import { PermissionsSet } from "./CheckPermissions.ts";
import { WritePermission, WritePermissionData, WRITE_PERMISSION_ID } from "./WritePermission.ts";
import { ReadPermission, ReadPermissionData, READ_PERMISSION_ID } from "./ReadPermission.ts";
import { PluginPermission, PLUGIN_PERMISSION_ID } from "./PluginPermission.ts";
import { expandGlobSync } from "https://deno.land/std@0.113.0/fs/expand_glob.ts";
import { uncompress } from "../util/uncompress.ts";
import { getConflictingLinks } from "../install/getConflictingLinks.ts";

export class PermissionData<T> {
    private value?: T;

    constructor(private readonly name: string) {
    }

    public get(): T {
        if (this.value === undefined) {
            throw new Error(`PermissionData value for ${this.name} is not set`);
        }
        return this.value;
    }

    public set(value: T): void {
        this.value = value;
    }
}

export class PermissionsDataCleanup {
    public cleanup: Runnable[] = [];
}

export class PermissionsData extends PermissionsDataCleanup {
    public writePermission = new PermissionData<WritePermissionData>(WRITE_PERMISSION_ID);
    public readPermission = new PermissionData<ReadPermissionData>(READ_PERMISSION_ID);
}

export interface PermissionWithType {
    type: string;
    permission: Permission;
}

export const PERMISSIONS: PermissionWithType[] = [
    { type: PLUGIN_PERMISSION_ID, permission: new PluginPermission() },
    { type: WRITE_PERMISSION_ID, permission: new WritePermission() },
    { type: READ_PERMISSION_ID, permission: new ReadPermission() },
];

export function beforePlugin(
    input: CallPluginInput,
    inputAdjustment: InputAdjustment,
    data: PermissionsData
): void {
    permissionToCode(input.permissions).forEach((permission) => permission.beforePlugin(input, inputAdjustment, data));
}

export function afterPlugin(
    input: CallPluginInput,
    inputAdjustment: InputAdjustment,
    data: PermissionsData
): void {
    permissionToCode(input.permissions).forEach((permission) => permission.afterPlugin(input, inputAdjustment, data));
}

export function cleanupPlugin(_input: CallPluginInput, _inputAdjustment: InputAdjustment, data: PermissionsDataCleanup): void {
    data.cleanup.forEach((cleanup) => {
        try {
            cleanup();
        } catch (e) {
            console.error(e.message);
        }
    });
}

export function addPluginPermission(permissions: PermissionInput[]): PermissionInput[] {
    return isPermission(PLUGIN_PERMISSION_ID, permissions)
        ? permissions
        : permissions.concat([{ type: PLUGIN_PERMISSION_ID, html: '' }]);
}

function isPermission(permissionType: string, permissions: PermissionInput[]): boolean {
    return permissions.find((permission) => permissionType === permission.type) !== undefined;
}

export function getDenoPermissions(
    // todo: remove '& PermissionsSet'
    input: CallPluginInput & PermissionsSet,
    inputAdjustment: InputAdjustment,
    data: PermissionsData
): DenoPermissions {
    const result = DENO_PERMISSIONS_EMPTY;
    permissionToCode(input.permissions).forEach((permission) => {
        const moreDenoPermissions = permission.getDenoPermissions(input, inputAdjustment, data);
        result.allowRead = result.allowRead.concat(moreDenoPermissions.allowRead);
        result.allowWrite = result.allowWrite.concat(moreDenoPermissions.allowWrite);
    });
    return result;
}

function permissionToCode(permissions?: PermissionInput[]): Permission[] {
    return undefinedToValue(permissions, []).map((permission) => {
        const maybePermission = permissionByType(permission.type);
        if (maybePermission === undefined) {
            throw new Error(`Permission "${permission.type}" not found`);
        } else {
            return maybePermission;
        }
    });
}

export function toDenoOptions(denoPermissions: DenoPermissions): string[] {
    const allowRead = toDenoOption('--allow-read=', denoPermissions.allowRead);
    const allowWrite = toDenoOption('--allow-write=', denoPermissions.allowWrite);
    return allowRead.concat(allowWrite);
}

function toDenoOption(prefix: string, values: string[]): string[] {
    return values.length === 0 ? [] : [prefix + values.join(',')];
}

function getExtensionFolderChrome(internal: Internal): string {
    return `${internal.path}/${internal.profile}/Extensions/${internal.extension}/${internal.version}_0/`;
}

function getExtensionFolderFirefox(internal: Internal): string {
    // todo: profile is not used yet
    const tempDir = Deno.makeTempDirSync();
    try {
        const cacheDir = `../../cache/${internal.uuid}/${internal.profile}/${internal.extension}/${internal.version}`;

        if (!exists(cacheDir)) {
            const xpiFile = `${internal.path}/*.default/extensions/${internal.extension}.xpi`;
            const xpiFound = Array.from(expandGlobSync(xpiFile));

            if (xpiFound.length === 0) {
                throw new Error('No .xpi file found');
            }

            if (xpiFound.length !== 1) {
                throw new Error('More than one .xpi file found');
            }

            uncompress(xpiFound[0].path, tempDir);

            const manifestJsonName = `${tempDir}/manifest.json`;

            if (!exists(manifestJsonName)) {
                throw new Error('totheos.json not found in .xpi file');
            }

            const manifest = JSON.parse(Deno.readTextFileSync(manifestJsonName));

            if (internal.version !== manifest.version) {
                throw new Error('Extension version mismatch');
            }

            Deno.mkdirSync(cacheDir, { recursive: true });
            Deno.renameSync(tempDir, cacheDir);
        }

        return cacheDir + '/';
    } catch (e) {
        Deno.removeSync(tempDir, { recursive: true });
        throw e;
    }
}

export function getExtensionFolderWithConflictResolution(
    internal: Internal,
    linksDir: string,
    checkFile = 'totheos.json'
): string {
    // todo: test checkFile
    try {
        const firstTry = getExtensionFolder(internal);
        if (exists(firstTry + '/' + checkFile)) {
            return firstTry;
        }
    } catch (_e) {
        // ignore
    }

    const paths = getConflictingLinks(linksDir, internal.uuid);

    const maybeResult = paths
        .map((path) => {
            const modified = Object.assign({}, internal, { path });
            try {
                const dir = getExtensionFolder(modified);
                if (exists(dir + '/' + checkFile)) {
                    return dir;
                }
            } catch (_e) {
                // ignore
            }
            return undefined;
        })
        .find((path) => path !== undefined);

    if (maybeResult === undefined) {
        throw new Error(`No extension or ${checkFile} file found`);
    }

    return maybeResult;
}

export function getExtensionFolder(internal: Internal): string {
    const valid = isNameValid(internal.profile) && isNameValid(internal.extension) && isNameValid(internal.version);
    if (!valid) {
        throw new Error('Not correct profile, extension or version');
    }
    return internal.browser === 'firefox' ? getExtensionFolderFirefox(internal) : getExtensionFolderChrome(internal);
}

export function permissionByType(type: string): Permission | undefined {
    const maybePermission = PERMISSIONS.find((permission) => permission.type === type);
    return maybePermission === undefined ? undefined : maybePermission.permission;
}
