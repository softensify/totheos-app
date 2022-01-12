// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

const buffer = new Uint8Array(1024);
const size = Deno.stdin.readSync(buffer) || 0;
const input = JSON.parse(new TextDecoder().decode(buffer.slice(0, size)));
Deno.stdout.writeSync(new TextEncoder().encode(JSON.stringify(input)));
