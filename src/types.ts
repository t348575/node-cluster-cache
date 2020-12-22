import * as stream from "stream";
export interface ConstructOptions {
    appName: string;
}
export enum ErrorsEnum {
    invalidMode,
    improperKey,
    unknownError,
    noSuchKey
}
export type Errors = {
    error: string;
    errNo: number;
    message?: Message;
    errorString?: string;
}
export type MessageReply = {
    id: bigint;
    name: string;
    op: 'error';
    error: Errors;
} | {
    id: bigint;
    name: string;
    op: 'setR';
    status: boolean;
} | {
    id: bigint;
    name: string;
    op: 'getR';
    key: string;
    mode: 'equ' | undefined;
    status: true;
    data: string | Buffer | number | object;
} | {
    id: bigint;
    name: string;
    op: 'getR';
    key: string;
    mode: 'equ' | undefined;
    status: false;
    reason: Errors;
};
export type Message = {
    id: bigint;
    name: string;
    op: 'set';
    key: string;
    mode: 'equ' | undefined;
    data: string | Buffer | number | object;
} | {
    id: bigint;
    name: string;
    op: 'set';
    key: string;
    mode: 'stream';
    data: stream.Readable | stream.Duplex | stream.Writable;
} | {
    id: bigint;
    name: string;
    op: 'get';
    key: string;
    mode: 'equ' | undefined;
};
/*
export interface MessageType {
    op: 'set' | 'get' | 'app' | 'del' | 'clr';
    mode: 'equ' | 'stream';
    data: string | Buffer | number | object | stream.Readable | stream.Duplex | stream.Writable;
}
 */
