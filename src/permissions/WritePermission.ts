// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { CallPluginInput } from "../plugins/callPlugin.ts";
import { PermissionInput } from "../process.ts";
import { PermissionsSet } from "./CheckPermissions.ts";
import { DenoPermissions, getPermissionInput, getPermissionInputAttributes, InputAdjustment, Permission } from './Permission.ts';
import { PermissionsData } from "./Permissions.ts";

export const WRITE_PERMISSION_ID = 'write';

export interface WritePermissionData {
    path: string;
}

export class WritePermission implements Permission {
    public beforePlugin(
        // todo: remove '& PermissionsSet'
        input: CallPluginInput & PermissionsSet,
        inputAdjustment: InputAdjustment,
        data: PermissionsData
    ): void {
        const permissionInput = getPermissionInput(input.permissions, WRITE_PERMISSION_ID);
        const [attribute, path] = getPermissionInputAttributes(permissionInput, ['attribute', 'path']);
        inputAdjustment[attribute] = path;
        data.writePermission.set({ path });
    }

    public afterPlugin(_input: CallPluginInput, _inputAdjustment: InputAdjustment, _data: PermissionsData): void {}

    public getDenoPermissions(
        _input: CallPluginInput,
        _inputAdjustment: InputAdjustment,
        data: PermissionsData
    ): DenoPermissions {
        return {
            allowWrite: [data.writePermission.get().path],
            allowRead: [],
        };
    }

    public equals(permission1: PermissionInput, permission2: PermissionInput): boolean {
        return permission1.type === permission2.type && permission1['path'] === permission2['path'];
    }

    public getHtml(permission: PermissionInput): string {
        return `<li>Permission <b>to Write</b> to file or directory (including all subdirectories or files):<div style="margin-top:15px;font-weight:bold">${permission['path']}</li>`;
    }
}
