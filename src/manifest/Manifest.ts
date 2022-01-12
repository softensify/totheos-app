// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { isBoolean,isArrayInstanceof,isString } from "../util/types.ts";

export interface Manifest {
	remote: boolean;
	permissions: string[];
}

export function checkManifest(input: Partial<Manifest>): Manifest {
	if (isBoolean(input.remote) && isArrayInstanceof<string>(input.permissions, isString)) {
		return input as Manifest;
	} else {
		throw new Error('Not correct manifest format');
	}
}

export function readManifest(fileName: string): Manifest {
	const content = Deno.readTextFileSync(fileName);
	const json = JSON.parse(content);
	return checkManifest(json);
}
