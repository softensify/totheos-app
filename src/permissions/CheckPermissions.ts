// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { PermissionInput } from "../process.ts";
import { undefinedToValue } from "../util/types.ts";
import { Permission } from "./Permission.ts";
import { addPluginPermission, permissionByType, PERMISSIONS } from "./Permissions.ts";
import { PLUGIN_PERMISSION_ID } from "./PluginPermission.ts";

export interface PermissionsSet {
    readonly permissions?: PermissionInput[];
    readonly granted: PermissionInput[];
    readonly rejected: PermissionInput[];
}

export enum CheckPermissionsStatus {
	Success,
	Rejected,
	Ask,
}

export interface CheckPermissionsSuccess {
	status: CheckPermissionsStatus.Success;
}

export interface CheckPermissionsRejected {
	status: CheckPermissionsStatus.Rejected;
}

export interface HtmlPermissions {
    type: string;
    html: string;
}

export interface CheckPermissionsAsk {
    status: CheckPermissionsStatus.Ask;
    htmlGranted: HtmlPermissions[];
    htmlAsk: HtmlPermissions[];
    permissions: PermissionInput[];
}

export type CheckPermissionsResult = CheckPermissionsSuccess | CheckPermissionsRejected | CheckPermissionsAsk;

function getPermission(type: string): Permission {
	const maybePermission = permissionByType(type);
	if (maybePermission === undefined) {
        throw new Error(`Permission '${type}' not found`);
    } else {
        return maybePermission;
    }
}

function equalPermissions(permission1: PermissionInput, permission2: PermissionInput): boolean {
	return permission1.type === permission2.type && getPermission(permission1.type).equals(permission1, permission2);
}

function permissionIn(permissionToFind: PermissionInput, permissions: PermissionInput[]): boolean {
	return permissions.find((permission) => equalPermissions(permission, permissionToFind)) !== undefined;
}

function permissionsNotInGranted(permissions: PermissionInput[], granted: PermissionInput[]): PermissionInput[] {
	return permissions.filter((permission) => !permissionIn(permission, granted));
}

function anyPermissionsInRejected(permissions: PermissionInput[], rejected: PermissionInput[]): boolean {
    return permissions.find((permission) => permissionIn(permission, rejected)) !== undefined;
}

function getHtml(permissions: PermissionInput[]): PermissionInput[] {
	return permissions.map((permission) => { return Object.assign({}, permission, { html: getPermission(permission.type).getHtml(permission) }); });
}

function getByType(permissions: PermissionInput[], type: string): PermissionInput | undefined {
	return permissions.find((permission) => permission.type === type);
}

function sortPermissions(permissions: PermissionInput[]): PermissionInput[] {
	return PERMISSIONS.map((permission) => getByType(permissions, permission.type))
		.filter((permission) => permission !== undefined)
		.map((permission) => permission as PermissionInput);
}

export function removePluginPermission(permissions: PermissionInput[]): PermissionInput[] {
	return permissions.filter((permission) => permission.type !== PLUGIN_PERMISSION_ID);
}

export function checkPermissions(permissionsSet: PermissionsSet): CheckPermissionsResult {
	const permissions = addPluginPermission(undefinedToValue(permissionsSet.permissions, []));
	const notGrantedYet = permissionsNotInGranted(permissions, permissionsSet.granted);

	if (notGrantedYet.length === 0) {
		return { status: CheckPermissionsStatus.Success };
	} else {
		const anyRejected = anyPermissionsInRejected(permissions, permissionsSet.rejected);

		if (anyRejected) {
			return { status: CheckPermissionsStatus.Rejected };
		} else {
			return {
                status: CheckPermissionsStatus.Ask,
                htmlGranted: getHtml(sortPermissions(permissionsSet.granted)),
                htmlAsk: getHtml(sortPermissions(notGrantedYet)),
                permissions: getHtml(notGrantedYet),
            };
		}
	}
}

export function allPermissionsAreInList(permissions: PermissionInput[], list: string[]): boolean {
	return permissions.every((permission) => list.indexOf(permission.type) !== -1);
}
