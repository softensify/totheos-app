// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { expandGlobSync } from "https://deno.land/std@0.113.0/fs/expand_glob.ts";
import { NativeMessagingManifestParameters } from "./createLinkFiles.ts";

function setLink(fileName: string, extensionId: string): void {
	const manifest = JSON.parse(Deno.readTextFileSync(fileName)) as NativeMessagingManifestParameters;
	const patched = Object.assign({}, manifest, { "allowed_origins": [`chrome-extension://${extensionId}/`] });
	Deno.writeTextFileSync(fileName, JSON.stringify(patched));
}

export function setLinks(extensionId: string): void {
	Array.from(expandGlobSync('../../links/*/*.json')).forEach((fileName) => setLink(fileName.path, extensionId));
}