// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { describe, it } from 'https://deno.land/x/test_suite@0.9.0/mod.ts';
import { assertEquals, assertThrows } from 'https://deno.land/std@0.113.0/testing/asserts.ts';
import { getPermissionInput } from "./Permission.ts";
import { READ_PERMISSION_ID } from "./ReadPermission.ts";

describe('Permission', () => {
	describe('getPermissionInput', () => {
		it('permission not found', () => assertThrows(() => getPermissionInput([], READ_PERMISSION_ID)));
		it('success', () =>
			assertEquals(
				getPermissionInput([{ type: READ_PERMISSION_ID, html: '' }], READ_PERMISSION_ID),
				{ type: READ_PERMISSION_ID, html: '' }
			)
		);
	});
});