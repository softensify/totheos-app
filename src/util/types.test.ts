// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { describe, it } from 'https://deno.land/x/test_suite@0.9.0/mod.ts';
import { assertEquals, assertThrows } from 'https://deno.land/std@0.113.0/testing/asserts.ts';
import { NOOP, notUndefined, undefinedToValue } from "./types.ts";

describe('types', () => {

	it('notUndefined', () => {
		assertEquals(notUndefined(1), 1);
		assertThrows(() => notUndefined(undefined));
	});

	it('undefinedToValue', () => {
        assertEquals(undefinedToValue(1, 2), 1);
        assertEquals(undefinedToValue(undefined, 2), 2);
    });

	it('NOOP', () => NOOP());
});
