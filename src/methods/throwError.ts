// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

import { EmptyObject } from '../util/types.ts';

export const ERROR = 'Test error';

type ThrowErrorInput = EmptyObject;
type ThrowErrorResult = EmptyObject;

export function throwError(_input: ThrowErrorInput): ThrowErrorResult {
	throw new Error(ERROR);
}
