// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { Producer } from './types.ts';
import { download as downloadLib } from 'https://deno.land/x/download@v1.0.1/mod.ts';
import { basename, dirname } from 'https://deno.land/std@0.113.0/path/mod.ts';

function tempFileNameProducer(): string {
  return Deno.makeTempFileSync();
}

export async function download(url: string, fileNameProducer: Producer<string> = tempFileNameProducer): Promise<string> {
  const fullName = fileNameProducer();
  await downloadLib(url, { file: basename(fullName), dir: dirname(fullName) });
  return fullName; 
}
