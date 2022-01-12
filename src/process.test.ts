// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { Application, Router } from 'https://deno.land/x/oak@v9.0.1/mod.ts';
import { afterEach, beforeEach, describe, it } from 'https://deno.land/x/test_suite@0.9.0/mod.ts';
import { assertEquals } from 'https://deno.land/std@0.113.0/testing/asserts.ts';
import { Input, METHOD_AND_PLUGIN_UNDEFINED, METHOD_NOT_FOUND, NO_BROWSER, NO_EXTENSION, NO_PERMISSIONS, NO_PROFILE, NO_VERSION, ON_UNDEFINED, PermissionInput, PLUGIN_ERROR, process, REJECTED_ERROR } from './process.ts';
import { VERSION } from './methods/getAppInfo.ts';
import { ERROR } from './methods/throwError.ts';
import { getExtensionFolder } from './permissions/Permissions.ts';
import { basename } from 'https://deno.land/std@0.113.0/path/mod.ts';
import { PLUGIN_HTML, PLUGIN_PERMISSION_ID } from "./permissions/PluginPermission.ts";
import { READ_HTML, READ_PERMISSION_ID } from "./permissions/ReadPermission.ts";
import { Manifest } from "./manifest/Manifest.ts";

const mockHttpPort = 8888;

function copyPluginToBrowserFolder(
    path: string,
    profile: string,
    extension: string,
    version: string,
    manifest: Partial<Manifest>
): string {
    const tempDir = Deno.makeTempDirSync();
    const folder = getExtensionFolder({ browser: 'chrome', path: tempDir, profile, extension, version, uuid: '' });
    Deno.mkdirSync(folder, { recursive: true });
    Deno.copyFileSync(path, folder + '/' + basename(path));
    Deno.writeTextFileSync(folder + '/totheos.json', JSON.stringify(manifest));
    return tempDir;
}

function putManifestIntoBrowserFolder(
    profile: string,
    extension: string,
    version: string,
    manifest: Partial<Manifest>
): string {
    const tempDir = Deno.makeTempDirSync();
    const folder = getExtensionFolder({ browser: 'chrome', path: tempDir, profile, extension, version, uuid: '' });
    Deno.mkdirSync(folder, { recursive: true });
    Deno.writeTextFileSync(
        folder + '/totheos.json',
        JSON.stringify(manifest)
    );
    return tempDir;
}

describe('process', () => {

    const os = Deno.build.os;
    const profile = 'Default';
    const extension = 'abc';
    const version = '1.0';
    const uuid = 'test-uuid';
    const browser = 'chrome';
    const internal = { profile, extension, version, browser };
    const granted: PermissionInput[] = [];
    const rejected: PermissionInput[] = [];
    const READ_PERMISSION: PermissionInput = { type: READ_PERMISSION_ID, attribute: 'path', path: '/tmp', html: READ_HTML('/tmp') };
    const READ_PERMISSION_WITHOUT_ATTRIBUTES: PermissionInput = { type: READ_PERMISSION_ID, html: '' };
    const PLUGIN_PERMISSION: PermissionInput = { type: PLUGIN_PERMISSION_ID, html: '' };
    const UNKNOWN_PERMISSION: PermissionInput = { type: 'unknown', html: '' };

    let tempDir: string | undefined;

    afterEach(() => {
        if (tempDir !== undefined) {
            Deno.removeSync(tempDir, { recursive: true });
            tempDir = undefined;
        }
    });

    it('getAppInfo', async () =>
        assertEquals(await process({ method: 'getAppInfo', internal, granted, rejected }, '.', uuid), {
            success: true,
            version: VERSION,
            os,
            uuid,
        }));

    it('throwError', async () =>
        assertEquals(await process({ method: 'throwError', internal, granted, rejected }, '.', uuid), {
            success: false,
            error: ERROR,
        }));

    it('undefined', async () => assertEquals(await process(undefined, '.', uuid), ON_UNDEFINED));

    it('method not found', async () =>
        assertEquals(
            await process({ method: 'not_found', internal } as unknown as Input, '.', uuid),
            METHOD_NOT_FOUND
        ));

    it('extension not set', async () =>
        assertEquals(await process({ plugin: 'testPlugin.ts', internal: {} } as unknown as Input, '.', uuid), NO_EXTENSION));

    it('profile not set', async () =>
        assertEquals(await process({ plugin: 'testPlugin.ts', internal: { extension } } as unknown as Input, '.', uuid), NO_PROFILE));

    it('version not set', async () =>
        assertEquals(await process({ plugin: 'testPlugin.ts', internal: { extension, profile } } as unknown as Input, '.', uuid), NO_VERSION));

    it('browser not set', async () =>
        assertEquals(await process({ plugin: 'testPlugin.ts', internal: { extension, profile, version } } as unknown as Input, '.', uuid), NO_BROWSER));

    it('method and plugin not set', async () =>
        assertEquals(await process({ internal } as unknown as Input, '.', uuid), METHOD_AND_PLUGIN_UNDEFINED));

    it('no permission', async () =>
        assertEquals(
            await process(
                {
                    plugin: 'testPlugin.ts',
                    permissions: [],
                    granted: [],
                    rejected: [],
                    internal
                },
                '.',
                uuid
            ),
            NO_PERMISSIONS
        ));
    
    it('just run plugin permission', async () =>
        assertEquals(
            await process(
                {
                    plugin: 'testPlugin.ts',
                    permissions: [PLUGIN_PERMISSION],
                    granted: [],
                    rejected: [],
                    internal,
                },
                '.',
                uuid
            ),
            NO_PERMISSIONS
        ));

    it('no plugin permission', async () => {
        tempDir = copyPluginToBrowserFolder(
            'src/plugins/testPlugin.ts',
            profile,
            extension,
            version,
            { remote: false, permissions: [READ_PERMISSION.type] }
        );
        assertEquals(
            await process(
                {
                    plugin: 'testPlugin.ts',
                    permissions: [READ_PERMISSION],
                    granted: [],
                    rejected: [],
                    internal,
                },
                tempDir,
                uuid
            ),
            {
                success: true,
                internal: {
                    command: 'ask',
                    htmlGranted: [],
                    htmlAsk: [
                        { type: PLUGIN_PERMISSION_ID, html: PLUGIN_HTML },
                        { type: READ_PERMISSION_ID, html: READ_HTML(READ_PERMISSION.path), attribute: 'path', path: '/tmp' }
                    ],
                    permissions: [READ_PERMISSION, PLUGIN_PERMISSION],
                },
            }
        );
    });

    it('plugin permission rejected', async () => {
        tempDir = copyPluginToBrowserFolder(
            'src/plugins/testPlugin.ts',
            profile,
            extension,
            version,
            { remote: false, permissions: [READ_PERMISSION.type] }
        );
        assertEquals(
            await process(
                {
                    plugin: 'testPlugin.ts',
                    permissions: [READ_PERMISSION],
                    granted: [],
                    rejected: [PLUGIN_PERMISSION],
                    internal,
                },
                tempDir,
                uuid
            ),
            REJECTED_ERROR
        );
    });

    it('unknown plugin permission', async () => {
        tempDir = copyPluginToBrowserFolder(
            'src/plugins/testPlugin.ts',
            profile,
            extension,
            version,
            { remote: false, permissions: [UNKNOWN_PERMISSION.type] }
        );
        assertEquals(
            await process(
                {
                    plugin: 'testPlugin.ts',
                    permissions: [UNKNOWN_PERMISSION],
                    granted: [PLUGIN_PERMISSION, UNKNOWN_PERMISSION],
                    rejected: [],
                    internal,
                },
                tempDir,
                uuid
            ),
            {
                success: false,
                error: 'Plugin error',
                exception: `Permission 'unknown' not found`,
            }
        );
    });

    it('plugin miss attribute', async () => {
        tempDir = copyPluginToBrowserFolder(
            'src/plugins/testPlugin.ts',
            profile,
            extension,
            version,
            { remote: false, permissions: [READ_PERMISSION.type] }
        );
        assertEquals(
            await process(
                {
                    plugin: 'testPlugin.ts',
                    permissions: [READ_PERMISSION_WITHOUT_ATTRIBUTES],
                    granted: [PLUGIN_PERMISSION, READ_PERMISSION_WITHOUT_ATTRIBUTES],
                    rejected: [],
                    internal,
                },
                tempDir,
                uuid
            ),
            {
                success: false,
                error: 'Plugin error',
                exception: `Required attribute 'attribute' not found`,
            }
        );
    });

    it('not correct totheos.json format', async () => {
        tempDir = copyPluginToBrowserFolder(
            'src/plugins/testPlugin.ts',
            profile,
            extension,
            version,
            { remote: 'not correct', permissions: [READ_PERMISSION.type] } as unknown as Partial<Manifest>
        );
        assertEquals(
            await process(
                {
                    plugin: 'testPlugin.ts',
                    permissions: [READ_PERMISSION_WITHOUT_ATTRIBUTES],
                    granted: [PLUGIN_PERMISSION, READ_PERMISSION_WITHOUT_ATTRIBUTES],
                    rejected: [],
                    internal,
                },
                tempDir,
                uuid
            ),
            {
                success: false,
                error: 'Plugin error',
                exception: 'Not correct manifest format',
            }
        );
    });

    describe('run plugin from file', () => {
        let tempDir: string | undefined;

        afterEach(() => {
            if (tempDir !== undefined) {
                Deno.removeSync(tempDir, { recursive: true });
                tempDir = undefined;
            }
        });

        it('testPlugin', async () => {
            tempDir = copyPluginToBrowserFolder(
                'src/plugins/testPlugin.ts',
                profile,
                extension,
                version,
                { remote: false, permissions: [READ_PERMISSION.type] }
            );
            assertEquals(
                await process(
                    {
                        plugin: 'testPlugin.ts',
                        parameters: { success: true, test: true },
                        permissions: [READ_PERMISSION],
                        granted: [PLUGIN_PERMISSION, READ_PERMISSION],
                        rejected: [],
                        internal,
                    },
                    tempDir,
                    uuid
                ),
                {
                    path: READ_PERMISSION.path,
                    success: true,
                    test: true,
                }
            );
        });

        it('not exists', async () => {
            tempDir = putManifestIntoBrowserFolder(profile,
                extension,
                version,
                { remote: false, permissions: [READ_PERMISSION.type] }
            );
            assertEquals(
                await process(
                    {
                        plugin: 'notExists.ts',
                        parameters: { success: true, test: true },
                        permissions: [READ_PERMISSION],
                        granted: [PLUGIN_PERMISSION, READ_PERMISSION],
                        rejected: [],
                        internal,
                    },
                    tempDir,
                    uuid
                ),
                {
                    success: false,
                    error: 'Plugin error',
                    exception: 'notExists.ts file not found',
                }
            );
        });

        it('testErrorPlugin', async () => {
            tempDir = copyPluginToBrowserFolder(
                'src/plugins/testErrorPlugin.ts',
                profile,
                extension,
                version,
                { remote: false, permissions: [READ_PERMISSION.type] }
            );
            assertEquals(
                await process(
                    {
                        plugin: 'testErrorPlugin.ts',
                        permissions: [READ_PERMISSION],
                        granted: [PLUGIN_PERMISSION, READ_PERMISSION],
                        rejected: [],
                        internal,
                    },
                    tempDir,
                    uuid
                ),
                Object.assign({}, PLUGIN_ERROR, { exception: 'Unexpected end of JSON input' })
            );
        });
    });

    describe('run plugin from url', () => {

        let controller: AbortController;
        let listenPromise: Promise<void>;
        const random = Math.random();
        let tempDir: string | undefined;

        beforeEach(() => {
            const router = new Router();
            router.get(
                `/testPlugin-${random}.ts`,
                (context) => (context.response.body = Deno.readFileSync(`src/plugins/testPlugin.ts`))
            );

            const app = new Application();
            app.use(router.routes());
            app.use(router.allowedMethods());

            controller = new AbortController();
            const { signal } = controller;

            listenPromise = app.listen({ port: mockHttpPort, signal });
        });

        afterEach(async () => {
            controller.abort();
            await listenPromise;
            if (tempDir !== undefined) {
                Deno.removeSync(tempDir, { recursive: true });
                tempDir = undefined;
            }
        });

        it('success', async () => {
            tempDir = putManifestIntoBrowserFolder(profile,
                extension,
                version,
                { remote: true, permissions: [READ_PERMISSION.type] }
            );
            assertEquals(
                await process(
                    {
                        plugin: `http://localhost:8888/testPlugin-${random}.ts`,
                        permissions: [READ_PERMISSION],
                        granted: [PLUGIN_PERMISSION, READ_PERMISSION],
                        rejected: [],
                        parameters: { success: true, test: true },
                        internal,
                    },
                    tempDir,
                    uuid
                ),
                {
                    path: READ_PERMISSION.path,
                    success: true,
                    test: true,
                }
            );
        });

        it('blocked', async () => {
            tempDir = putManifestIntoBrowserFolder(profile,
                extension,
                version,
                { remote: false, permissions: [READ_PERMISSION.type] }
            );
            assertEquals(
                await process(
                    {
                        plugin: `http://localhost:8888/testPlugin-${random}.ts`,
                        permissions: [READ_PERMISSION],
                        granted: [PLUGIN_PERMISSION, READ_PERMISSION],
                        rejected: [],
                        parameters: { success: true, test: true },
                        internal,
                    },
                    tempDir,
                    uuid
                ),
                {
                    error: 'Plugin error',
                    exception: `Plugins from the Internet can only be used if 'remote' is set to 'true' in totheos.json`,
                    success: false,
                }
            );
        });
    });
});
