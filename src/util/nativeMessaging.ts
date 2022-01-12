// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

export function fromNative<T>(stream: Deno.ReaderSync & Deno.Closer): T | undefined {
    const size = readSize(stream);
    const result = size === undefined ? undefined : readJson(stream, size) as T;
    stream.close();
    return result;
}

const SIZE_PREFIX_LENGTH = 4;

export function toNative<T>(value: T): Uint8Array {
    const data = new TextEncoder().encode(JSON.stringify(value));
    const result = new Uint8Array(data.length + SIZE_PREFIX_LENGTH);
    result.set(numberToBuffer(data.length));
    result.set(data, SIZE_PREFIX_LENGTH);
    return result;
}

function numberToBuffer(value: number): Uint8Array {
    const result = new Uint8Array(SIZE_PREFIX_LENGTH);
    for (let count = 0; count < SIZE_PREFIX_LENGTH; count++) {
        result.set(new Uint8Array([value & 0xff]), count);
        value = value >> 8;
    }

    return result;
}

function readJson<T>(stream: Deno.ReaderSync, size: number): T | undefined {
	const buffer = new Uint8Array(size);
    const readCount = stream.readSync(buffer);
    try {
        return readCount === size ? JSON.parse(new TextDecoder().decode(buffer.subarray(0, size))) : undefined;
    } catch (_e) {
        return undefined;
    }
}

function readSize(stream: Deno.ReaderSync): number | undefined {
	const buffer = new Uint8Array(4);
	const readCount = stream.readSync(buffer);
	return readCount === 4 ? bufferToSize(buffer) : undefined;
}

function bufferToSize(buffer: Uint8Array): number {
	let result = 0;
	let count = 0;
	let multiplier = 1;

	while (true) {
		const maybeNumber = buffer.at(count++);
		if (maybeNumber) {
			result += maybeNumber * multiplier;
			multiplier = multiplier << 8;
		} else {
			return result;
		}
	}
}

