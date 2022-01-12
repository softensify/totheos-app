// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

export type Runnable = () => void;
export type Consumer<T> = (value: T) => void;
export type Transform<T, R> = (value: T) => R;
export type BiConsumer<T, U> = (value1: T, value2: U) => void;
export type Producer<T> = () => T;
export type EmptyObject = Record<string, unknown>;
export type JsObject = Record<string | number | symbol, unknown>;

const HTTP = 'http://';
const HTTPS = 'https://';

export function notUndefined<T>(maybeValue: T | undefined): T {
	if (maybeValue === undefined) {
		throw new Error('Unexpected undefined value');
	} else {
		return maybeValue;
	}
}

export function undefinedToValue<T>(maybeValue: T | undefined, otherValue: T): T {
	return maybeValue === undefined ? otherValue : maybeValue;
}

export function isObject(value: unknown): value is JsObject {
    return typeof value === 'object';
}

export const NOOP = () => { };

export function isBoolean(value: unknown): value is boolean {
    return value === true || value === false;
}

export function isArray(array: unknown): array is unknown[] {
    return Array.isArray(array);
}

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isArrayInstanceof<T>(array: unknown, checkElement: Transform<unknown, boolean>): array is Array<T> {
	return isArray(array) && (array as unknown[]).every((element: unknown) => checkElement(element));
}

export function isHttpOrHttps(value: string): boolean {
    return value.startsWith(HTTP) || value.startsWith(HTTPS);
}
