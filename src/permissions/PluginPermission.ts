// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { CallPluginInput } from "../plugins/callPlugin.ts";
import { PermissionInput } from "../process.ts";
import { DenoPermissions, InputAdjustment, Permission } from './Permission.ts';
import { PermissionsData } from "./Permissions.ts";

export const PLUGIN_PERMISSION_ID = 'plugin';
export const PLUGIN_HTML = '';

export class PluginPermission implements Permission {
    public beforePlugin(_input: CallPluginInput, _inputAdjustment: InputAdjustment, _data: PermissionsData): void {}

    public afterPlugin(_input: CallPluginInput, _inputAdjustment: InputAdjustment, _data: PermissionsData): void {}

    public getDenoPermissions(
        _input: CallPluginInput,
        _inputAdjustment: InputAdjustment,
        _data: PermissionsData
    ): DenoPermissions {
        return {
            allowWrite: [],
            allowRead: [],
        };
    }

    public equals(permission1: PermissionInput, permission2: PermissionInput): boolean {
        return permission1.type === permission2.type;
    }

    public getHtml(_permission: PermissionInput): string {
        return PLUGIN_HTML;
    }
}
