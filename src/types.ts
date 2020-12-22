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

export type ErrorTypes = {
    error: string;
    errNo: number;
    message?: Message;
    errorString?: string;
}
export type dataType = string | number | object | Buffer | undefined;
export type streamType = stream.Readable | stream.Duplex | stream.Writable;
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
    error: ErrorTypes
} | {
    id: number;
    name: string;
    op: 'get';
    mode: 'equ' | undefined;
    status: true;
    data: dataType;
} | {
    id: number;
    name: string;
    op: 'get';
    mode: 'equ' | undefined;
    status: false;
    error: ErrorTypes;
};

export type Message = {
    id: number;
    name: string;
    op: 'set';
    key: string;
    mode: 'equ' | undefined;
    data: dataType;
} | {
    id: number;
    name: string;
    op: 'set';
    key: string;
    mode: 'stream';
    data: streamType;
} | {
    id: number;
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
