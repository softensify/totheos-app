ToTheOS is a native messaging framework for web browser extensions.

Extension developers can write native applications in JavaScript and Typescript, and run them in the Deno sandbox through ToTheOS. 

The ToTheOS Native Application Permissions System gives users control over how their computers’ resources will be used by native applications. When an extension needs to execute native application code with a set of permissions, users will be prompted to accept or decline them. Permissions “Read file” and “Write file” are currently supported; additional  permissions will be added soon.

The extension must have a totheos.json manifest file to list all native application permissions it would like to request from users to run native application code, and to show if full native application code is included in the extension.

ToTheOS framework works with Google Chrome, Chromium, Microsoft Edge, Brave and Vivaldi. Operational Systems supported: Windows, macOS (Intel-base and M1) and Linux.

ToTheOS is available under a proprietary license (see https://github.com/softensify/totheos-extension and https://github.com/softensify/totheos-app).