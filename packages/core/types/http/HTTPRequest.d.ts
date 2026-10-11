/** @noSelfInFile */

/** @customConstructor HTTPRequest.new */
declare class HTTPRequest {
    constructor(url: string);
    AddHeader(name: string, value: string): void;
    Post(body: string, onSuccess: (this: void) => void, onFailure: (this: void) => void): void;
    Get(onSuccess: (this: void) => void, onFailure: (this: void) => void): void;
    Cancel(): void;
    readonly url: string;
    readonly header: string;
    readonly finished: boolean;
    readonly successful: boolean;
    readonly cancelled: boolean;
    readonly timedOut: boolean;
    readonly failed: boolean;
    readonly responseCode: number | undefined;
    readonly errorCode: number | undefined;
    readonly errorInfo: string | undefined;
    readonly downloadTotalBytes: number;
    readonly downloadedBytes: number;
    readonly progress: number;
    readonly data: string | undefined;
}
