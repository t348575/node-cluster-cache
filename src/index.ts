import * as ipc from 'node-ipc';
import {isMaster} from 'cluster';
import {ConstructOptions, Error, ErrorEnum, Message, MessageReply, dataType, streamType, errorType} from './types';
import {Socket} from 'net';
import * as stream from 'stream';
import {InternalEvents} from './internal-events';
export class NodeClusterCache {

    private dataMaps: Map<string, any>[] = [];
    private id: number = 0;
    private internalEvents: InternalEvents = new InternalEvents();
    private readonly name = process.env.node_cluster_cache_name;
    private readonly connectionName: string;
    private readonly isMaster: boolean = false;

    constructor(options: ConstructOptions) {
        this.connectionName = options.appName;
        ipc.config.silent = true;
        ipc.config.id = this.connectionName;
        this.isMaster = isMaster;
        for (let i = 0; i < 676; i++) {
            this.dataMaps.push(new Map());
        }
        if (this.isMaster) {
            this.name = 'master';
            ipc.serve(() => {
                ipc.server.on('message', this.messageHandler.bind(this));
                ipc.server.on('messageReply', this.messageHandler.bind(this));
            });
            ipc.server.start();
        } else {
            ipc.config.id += this.name;
            ipc.connectTo(this.connectionName, () => {
                ipc.of[this.connectionName].on('messageReply', this.messageReplyHandler.bind(this));
            });
        }
    }

    messageHandler(message: Message, socket ?: Socket): MessageReply {
        try {
            const dataMapIdx = this.getDataMapArrayIndex(message.key);
            if (dataMapIdx === -1) {
                return this.emitOrReturn('messageReply', this.getError(ErrorEnum.improperKey, message), socket);
            }
            switch (message.mode) {
                case undefined:
                case 'equ': {
                    let res;
                    switch (message.op) {
                        case 'set': {
                            this.dataMaps[dataMapIdx].set(message.key, message.data);
                            res = <MessageReply>{ id: message.id, name: message.name, op: 'set', status: true };
                            break;
                        }
                        case 'get': {
                            if (this.dataMaps[dataMapIdx].has(message.key)) {
                                res = <MessageReply> {
                                    id: message.id,
                                    name: message.name,
                                    op: 'get',
                                    mode: 'equ',
                                    status: true,
                                    data: this.dataMaps[dataMapIdx].get(message.key)
                                };
                            } else {
                                res = <MessageReply> {
                                    id: message.id,
                                    name: message.name,
                                    op: 'get',
                                    mode: 'equ',
                                    status: false,
                                    error: this.wrapError(ErrorEnum.noSuchKey)
                                };
                            }
                            break;
                        }
                    }
                    return this.emitOrReturn('messageReply', res, socket);
                }
                case 'stream': {
                    let res;
                    switch (message.op) {
                        case 'set': {

                            break;
                        }
                    }
                    break;
                }
                default: {
                    return this.emitOrReturn('messageReply', this.getError(ErrorEnum.invalidMode, message), socket);
                }
            }
        } catch (e) {
            return this.emitOrReturn('messageReply', this.getError(ErrorEnum.unknownError, message, e.toString()), socket);
        }
        return this.getBlankMessage();
    }

    messageReplyHandler(message: MessageReply, socket ?: Socket) {
        try {
            switch (message.op) {
                case 'set': {
                    this.internalEvents.emitter('reply', [message.id], message.id, message);
                    break;
                }
                case 'get': {
                    if (message.mode === undefined || (message.mode && message.mode === 'equ')) {
                        this.internalEvents.emitter('reply', [message.id], message.id, message);
                    } else {

                    }
                    break;
                }
            }
        } catch (e) {

        }
    }

    set(
        key: string,
        data: dataType,
        callback: undefined | ((err ?: errorType) => void) = undefined
    ): Promise<void> | void {
        const messageId = ++this.id;
        const message = <Message> {
            id: messageId,
            name: this.name,
            op: 'set',
            mode: 'equ',
            key,
            data
        };
        if (isMaster) {
            const res = this.messageHandler(message);
            if (callback) {
                callback(res.status ? undefined : res.error);
            } else {
                return new Promise((resolve, reject) => {
                    res.status ? resolve() : reject(res.error);
                });
            }
        } else {
            ipc.of[this.connectionName].emit('message', message);
            if (callback) {
                this.internalEvents.handleOnce('reply', [messageId], (id, message) => {
                    callback(message.status ? undefined : message.error);
                });
            } else {
                return new Promise((resolve, reject) => {
                    this.internalEvents.handleOnce('reply', [messageId], (id, message) => {
                        message.status ? resolve() : reject(message.error);
                    });
                });
            }
        }
    }

    setStream(
        key: string,
        stream: streamType,
        callback: undefined | ((err ?: errorType) => void) = undefined
    ): Promise<void> | void {
        const messageId = ++this.id;
        const message = <Message> {
            id: messageId,
            name: this.name,
            op: 'set',
            mode: 'stream',
            key,
            stream
        };
    }

    get(
        key: string,
        callback: undefined | ((err: errorType, data: dataType) => void) = undefined
    ): Promise<dataType> | void {
        const messageId = ++this.id;
        const message = <Message> {
            id: messageId,
            name: this.name,
            op: 'get',
            key,
            mode: 'equ'
        };
        if (this.isMaster) {
            const res = this.messageHandler(message);
            if (callback) {
                if (res.status && res.op === 'get') {
                    callback(undefined, res.data);
                } else if (!res.status && res.op === 'get') {
                    callback(res.error, undefined);
                }
            } else {
                return new Promise((resolve, reject) => {
                    if (res.status && res.op === 'get') {
                        resolve(res.data);
                    } else if (!res.status && res.op === 'get') {
                        reject(res.error);
                    }
                });
            }
        } else {
            ipc.of[this.connectionName].emit('message', message);
            if (callback) {
                this.internalEvents.handleOnce('reply', [messageId], (id, message) => {
                    if (message.status && message.op === 'get') {
                        callback(undefined, message.data);
                    } else if (!message.status && message.op === 'get') {
                        callback(message.error, undefined);
                    }
                });
            } else {
                return new Promise((resolve, reject) => {
                    this.internalEvents.handleOnce('reply', [messageId], (id, message) => {
                        if (message.status && message.op === 'get') {
                            resolve(message.data);
                        } else if (!message.status && message.op === 'get') {
                            reject(message.error);
                        }
                    });
                });
            }
        }
        /*if (callback) {
            this.internalEvents.listener('reply', [messageId], (id, message) => {
                this.internalEvents.delete('reply', [messageId]);
                // @ts-ignore
                callback(message.status ? undefined : message.error, message.data);
            });
        } else {
            return new Promise((resolve, reject) => {
                this.internalEvents.listener('reply', [messageId], (id, message: MessageReply) => {
                    this.internalEvents.delete('reply', [messageId]);
                    if (message.op === "get") {
                        message.status ? resolve(message.data) : reject(message.error);
                    }
                });
            });
        }*/
    }

    // Convenience methods

    emitOrReturn(event: string, data: any, socket ?: Socket): MessageReply {
        if (socket) {
            ipc.server.emit(socket, event, data);
        }
        return data;
    }
    getDataMapArrayIndex(key: string): number {
        if (key) {
            if (key.length >= 2) {
                return key.charCodeAt(0) + key.charCodeAt(1);
            } else if (key.length === 1) {
                return key.charCodeAt(0);
            } else {
                return -1;
            }
        }
        return -1;
    }
    getError(errorCode: ErrorEnum, message: Message, errorString?: string): MessageReply {
        return <MessageReply> {
            id: message.id,
            name: message.name,
            op: message?.op,
            status: false,
            error: this.wrapError(errorCode, message, errorString)
        }
    }
    wrapError(errorCode: ErrorEnum, message?: Message, errorString?: string): Error {
        return <Error> {
            error: ErrorEnum[errorCode],
            errNo: errorCode,
            message,
            errorString
        };
    }
    getBlankMessage(): MessageReply {
        return <MessageReply> {}
    }
}
