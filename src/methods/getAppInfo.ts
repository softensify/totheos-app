// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { Result } from '../types.ts';

export const VERSION = '0.0.1';

export interface GetAppInfoInput {
    readonly internal: {
        readonly uuid: string;
    };
}

export interface GetAppInfoResult extends Result {
    version: string;
    os: string;
    uuid: string;
}

export function getAppInfo(input: GetAppInfoInput): GetAppInfoResult {
    return { version: VERSION, os: Deno.build.os, uuid: input.internal.uuid};
}
