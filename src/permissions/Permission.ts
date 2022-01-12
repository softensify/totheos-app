// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { CallPluginInput } from "../plugins/callPlugin.ts";
import { PermissionInput } from "../process.ts";
import { Transform, undefinedToValue } from "../util/types.ts";
import { PermissionsData } from "./Permissions.ts";

export type InputAdjustment = { [key: string]: unknown };

export interface DenoPermissions {
    allowWrite: string[];
    allowRead: string[];
}

export const DENO_PERMISSIONS_EMPTY: DenoPermissions = {
    allowWrite: [],
    allowRead: [],
};

type Step = (
    input: CallPluginInput,
    inputAdjustment: InputAdjustment,
    data: PermissionsData,
) => void;

type GetDenoPermissions = (
    input: CallPluginInput,
    inputAdjustment: InputAdjustment,
    data: PermissionsData,
) => DenoPermissions;

type Equals = (
    permission1: PermissionInput,
    permission2: PermissionInput,
) => boolean;

export interface Permission {
    beforePlugin: Step;
    afterPlugin: Step;
    getDenoPermissions: GetDenoPermissions;
    equals: Equals;
    getHtml: Transform<PermissionInput, string>;
}

export function getPermissionInput(permissions: PermissionInput[] | undefined, type: string): PermissionInput {
    const result = undefinedToValue(permissions, []).find((permission) => permission.type === type);
    if (result === undefined) {
        throw new Error(`Permission '${type}' not found`);
    } else {
        return result;
    }
}

export function getPermissionInputAttributes(permissionInput: PermissionInput, attributeNames: string[]): string[] {
    return attributeNames.map((attributeName) => {
        if (permissionInput[attributeName] === undefined) {
            throw new Error(`Required attribute '${attributeName}' not found`);
        } else {
            return permissionInput[attributeName];
        }
    });
}