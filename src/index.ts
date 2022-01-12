// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { fromNative, toNative } from './util/nativeMessaging.ts';
import { process } from './process.ts';
import { install, installAdd, installFind, installList, installRules } from './install/install.ts';
import { update, usage } from './update/update.ts';
import { setLinks } from "./install/setLinks.ts";

switch (Deno.args[0]) {
    case 'message':
        Deno.stdout.writeSync(toNative(await process(fromNative(Deno.stdin), Deno.args[1], Deno.args[2])));
        break;

    case 'install-add':
        installAdd(Deno.args[1], Deno.args[2], Deno.args[3]);
        break;

    case 'install-set':
        setLinks(Deno.args[1]);
        break;

    case 'install-list':
        installList();
        break;

    case 'install-find':
        installFind();
        break;

    case 'install-rules':
        installRules();
        break;

    case 'install':
        install();
        break;

    case 'update':
        update(Deno.args[1]);
        break;

    default:
        console.error('Usage:');
        console.error(`  ${usage()} message BROWSER-PATH`);
        console.error(`  ${usage()} install-add firefox|chrome BROWSER-PATH WINDOWS-REGISTRY-KEY|LINK-PATH`);
        console.error(`  ${usage()} install-list`);
        console.error(`  ${usage()} install-find`);
        console.error(`  ${usage()} install-rules`);
        console.error(`  ${usage()} install-set EXTENSION-ID`);
        console.error(`  ${usage()} install`);
        console.error(`  ${usage()} update URL`);
        Deno.exit(1);
}
