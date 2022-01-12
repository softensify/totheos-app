// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { existsSync } from "https://deno.land/std@0.113.0/fs/exists.ts";
import { getExtensionFolderWithConflictResolution } from "../permissions/Permissions.ts";
import { Input, Internal } from '../process.ts';
import { Result } from '../types.ts';
import { isHttpOrHttps } from "../util/types.ts";

export interface CallPluginInput extends Input {
    readonly plugin: string;
    readonly internal: Internal;
    readonly parameters: {
        readonly  [key: string]: string;
    };
}

export type CallPluginResult = Result;

export type CallPlugin<T, R> = (input: T & CallPluginInput, denoOptions: string[]) => Promise<R & CallPluginResult>;

export async function callPlugin<T, R>(
    input: T & CallPluginInput,
    denoOptions: string[],
    remote: boolean,
): Promise<R & CallPluginResult> {
    const fullPlugin = getPluginFull(input);

    if (!isHttpOrHttps(fullPlugin) && !existsSync(fullPlugin)) {
        throw new Error(`${input.plugin} file not found`);
    }

    if (isHttpOrHttps(fullPlugin) && !remote) {
        throw new Error(`Plugins from the Internet can only be used if 'remote' is set to 'true' in totheos.json`);
    }
    
    const noRemoteOption = remote ? [] : ['--no-remote'];

    const cmd = [Deno.execPath(), 'run', '--no-check'].concat(denoOptions, noRemoteOption, [fullPlugin]);
    const p = Deno.run({ cmd: cmd, stdout: 'piped', stdin: 'piped' });

    await p.stdin.write(new TextEncoder().encode(JSON.stringify(input.parameters)));
    p.stdin.close();
    const output = await p.output();
    p.close();
    return JSON.parse(new TextDecoder().decode(output));
}

function getPluginFull(input: CallPluginInput): string {
    const prefix = isHttpOrHttps(input.plugin) ? '' : getExtensionFolderWithConflictResolution(input.internal, '../../links/');

    return prefix + input.plugin;
}
