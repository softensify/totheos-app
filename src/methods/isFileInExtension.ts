// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { getExtensionFolderWithConflictResolution } from "../permissions/Permissions.ts";
import { Internal } from "../process.ts";
import { ResultSuccess } from '../types.ts';

export interface IsFileInExtensionInput {
    readonly file: string;
    readonly internal: Internal;
}

export function isFileInExtension(input: IsFileInExtensionInput): ResultSuccess {
    // todo: check input.internal here or in process?
    getExtensionFolderWithConflictResolution(input.internal, '../../links/', input.file);
    return { success: true };
}
