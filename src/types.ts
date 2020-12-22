import * as stream from 'stream';

export interface ConstructOptions {
    appName: string;
}

export enum ErrorEnum {
    invalidMode,
    improperKey,
    unknownError,
    noSuchKey
}

export type Error = {
    error: string;
    errNo: number;
    message?: Message;
    errorString?: string;
}
export type errorType = undefined | Error;
export type dataType = string | number | object | Buffer | undefined;
export type streamType = stream.Readable | stream.Duplex | stream.Writable;
type equateName = 'equ' | undefined;
type streamName = 'stream';
export type MessageReply = {
    id: number;
    name: string;
    op: 'set';
    status: true;
} | {
    id: number;
    name: string;
    op: 'set';
    status: false;
    error: Error
} | {
    id: number;
    name: string;
    op: 'get';
    mode: equateName;
    status: true;
    data: dataType;
} | {
    id: number;
    name: string;
    op: 'get';
    mode: equateName;
    status: false;
    error: Error;
};

export type Message = {
    id: number;
    name: string;
    op: 'set';
    key: string;
    mode: equateName;
    data: dataType;
} | {
    id: number;
    name: string;
    op: 'set';
    key: string;
    mode: streamName;
    stream: streamType;
} | {
    id: number;
    name: string;
    op: 'get';
    key: string;
    mode: equateName;
};
/*
export interface MessageType {
    op: 'set' | 'get' | 'app' | 'del' | 'clr';
    mode: 'equ' | streamName;
    data: string | Buffer | number | object | stream.Readable | stream.Duplex | stream.Writable;
}
 */
