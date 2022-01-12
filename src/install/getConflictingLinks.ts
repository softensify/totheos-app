// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { expandGlobSync } from "https://deno.land/std@0.113.0/fs/expand_glob.ts";
import { LinkData } from "./createLinkFiles.ts";

export function getConflictingLinks(linksDir: string, uuid: string): string[] {
    const { link, path } = JSON.parse(Deno.readTextFileSync(`${linksDir}/${uuid}.json`)) as LinkData;

	return Array.from(expandGlobSync(`${linksDir}/*.json`))
        .filter((walk) => walk.isFile)
        .map((walk) => walk.path)
        .map((path) => Deno.readTextFileSync(path))
        .map((content) => JSON.parse(content) as LinkData)
        .filter((record) => path !== record.path)
        .filter((record) => link === record.link)
        .map((record) => record.path);
}
