// Copyright(c) 2022 Softensify Pty Ltd. www.softensify.com All rights reserved.

interface ResultSuccess {
    success: true;
    readonly result: {
        [key: string]: string;
    };
}

interface ResultFail {
  success: false;
  error: string;
}

type Result = ResultSuccess | ResultFail;
