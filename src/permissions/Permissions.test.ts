// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { describe, it } from 'https://deno.land/x/test_suite@0.9.0/mod.ts';
import { assertEquals, assertThrows } from 'https://deno.land/std@0.113.0/testing/asserts.ts';
import { addPluginPermission, cleanupPlugin, PermissionData } from './Permissions.ts';
import { spy, Spy, assertSpyCalls } from 'https://deno.land/x/mock@0.12.1/mod.ts';
import { NOOP, Runnable } from '../util/types.ts';
import { PLUGIN_PERMISSION_ID } from "./PluginPermission.ts";
import { READ_PERMISSION_ID } from "./ReadPermission.ts";

describe('Permissions', () => {
    describe('PermissionData', () => {
		const permissionData = new PermissionData<number>('test');

		it('get when not set', () => assertThrows(() => permissionData.get()));
		it('set, get', () => {
			permissionData.set(1);
			assertEquals(permissionData.get(), 1);
		});
    });

	it('cleanupPlugin', () => {
		const cleanup1: Spy<void> = spy(() => { throw new Error(); });
		const cleanup2: Spy<void> = spy(NOOP);
		const cleanup: Runnable[] = [cleanup1, cleanup2];
		// deno-lint-ignore no-explicit-any
		cleanupPlugin(undefined as any, {}, { cleanup })
		assertSpyCalls(cleanup1, 1);
		assertSpyCalls(cleanup2, 1);
	});

	it('addPluginPermission', () => {
		assertEquals(addPluginPermission([]), [{ type: PLUGIN_PERMISSION_ID, html: '' }]);
		assertEquals(addPluginPermission([{ type: READ_PERMISSION_ID, html: 'HTML1' }]), [
            { type: READ_PERMISSION_ID, html: 'HTML1' },
            { type: PLUGIN_PERMISSION_ID, html: '' },
        ]);
		assertEquals(addPluginPermission([{ type: PLUGIN_PERMISSION_ID, html: 'HTML2' }]), [
            { type: PLUGIN_PERMISSION_ID, html: 'HTML2' },
        ]);
    });
});