// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { existsSync } from 'https://deno.land/std@0.113.0/fs/exists.ts';
import { download } from "../util/download.ts";
import { uncompress } from "../util/uncompress.ts";
import * as fflate from 'https://cdn.skypack.dev/fflate';

export type Architecture = 'aarch64-apple' | 'x86_64-apple' | 'x86_64-pc-windows' | 'x86_64-linux';
export type Arch = 'x86_64' | 'aarch64';
export type Os = 'darwin' | 'linux' | 'windows';

interface ArchOsArchitecture {
    os: Os;
    arch?: Arch;
    architecture: Architecture;
}

const ARCH_OS_ARCHITECTURE: ArchOsArchitecture[] = [
    { os: 'windows', architecture: 'x86_64-pc-windows' },
    { os: 'linux', architecture: 'x86_64-linux' },
    { os: 'darwin', arch: 'x86_64', architecture: 'x86_64-apple' },
    { os: 'darwin', arch: 'aarch64', architecture: 'aarch64-apple' },
];

export interface DenoLink {
    readonly file: string;
    readonly url: string;
}

export interface ReleaseLinks {
    readonly deno: DenoLink;
    readonly full: string;
    readonly update: string;
}

export interface Release {
    readonly release: string;
    readonly links: Record<Architecture, ReleaseLinks>;
    readonly installer: string;
}

export function usage(): string {
    return Deno.build.os === 'windows' ? 'totheos' : './totheos.sh';
}

export async function update(url: string | undefined): Promise<void> {

    if (url === undefined) {
        console.error('No update URL specified.');
        console.error(`Usage: ${usage()} URL`);
        Deno.exit(1);
    }

    const res = await fetch(url);
    const content: Release = JSON.parse(await res.text());
    
    if (!existsSync(`../${content.release}`)) {
        const architecture = getArchitecture();
        const releaseLinks = content.links[architecture];
        const extension = architecture === 'x86_64-pc-windows' ? '.exe' : '';
        const denoFile = `../../deno/${releaseLinks.deno.file}`;

        if (!existsSync(denoFile)) {
            const downloaded = await download(releaseLinks.deno.url);
            const f = fflate.unzipSync(Deno.readFileSync(downloaded));
            for (const fileName in f) {
                if (fileName === `deno${extension}`) {
                    // deno-lint-ignore no-explicit-any
                    Deno.writeFileSync(denoFile, (f as any)[fileName]);
                }
            }
        }

        const downloaded = await download(releaseLinks.update);
        const unzipTo = Deno.makeTempDirSync();
        try {
            uncompress(downloaded, unzipTo);
            Deno.renameSync(`${unzipTo}/ToTheOs/release/${content.release}`, `../${content.release}`);
        } catch (_e) {
            Deno.removeSync(unzipTo, { recursive: true });
        }
    }
}

function getArchitecture(arch: Arch = Deno.build.arch, os: Os = Deno.build.os): Architecture {
    const result = ARCH_OS_ARCHITECTURE.find((record) => record.os === os && (record.arch === undefined || record.arch === arch));

    if (result === undefined) {
        throw new Error(`Not supported operational system '${os} ${arch}'`);
    } else {
        return result.architecture;
    }
}
