// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

const testPrefix = 'file://';
const testSuffix = '.test.ts';

export function file(testFileName: string, testDataName = ''): string {
  if (testFileName.startsWith(testPrefix) && testFileName.endsWith(testSuffix)) {
    return testFileName.substring(testPrefix.length, testFileName.length - testSuffix.length) + '/' + testDataName;
  } else {
    throw new Error(`Test file name ${testFileName} must start with ${testPrefix} and end with ${testSuffix}`);
  }
}

export function readToBuffer(fileName: string): Uint8Array {
	const stat = Deno.statSync(fileName);
	if (stat.isFile) {
		const file = Deno.openSync(fileName);
		const buffer = new Uint8Array(stat.size);
		file.readSync(buffer);
		file.close();
		return buffer;
	} else {
		throw new Error('Not a file');
	}
}