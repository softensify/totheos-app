// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import * as fflate from 'https://cdn.skypack.dev/fflate';
import { dirname } from 'https://deno.land/std@0.113.0/path/mod.ts';

export function uncompress(
  fileName: string,
  targetFolder: string,
): void {

  const f = fflate.unzipSync(Deno.readFileSync(fileName));
  for (const fileName in f) {
    const dirName = dirname(fileName);
    try {
      Deno.mkdirSync(targetFolder + '/' + dirName);
      // deno-lint-ignore no-empty
    } catch (_e) {
    }
    if (!fileName.endsWith('/')) {
      // deno-lint-ignore no-explicit-any
      Deno.writeFileSync(targetFolder + '/' + fileName, (f as any)[fileName]);
    }
  }
}
