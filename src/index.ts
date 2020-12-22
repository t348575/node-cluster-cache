import * as ipc from 'node-ipc';
import {isMaster} from 'cluster';
import {ConstructOptions, Errors, ErrorsEnum, Message, MessageReply} from "./types";
import {Socket} from "net";

export class Cache {
    private dataMaps: Map<string, any>[] = [];
    private readonly connectionName: string;
    private id = 0;
    private name = process.env.node_cluster_cache_name;
    constructor(options: ConstructOptions) {
        this.connectionName = options.appName;
        ipc.config.silent = true;
        ipc.config.id = this.connectionName;
        for (let i = 0; i < 676; i++) {
            this.dataMaps.push(new Map());
        }
        if (isMaster) {
            ipc.serve(() => {
                ipc.server.on('message', this.messageHandler.bind(this));
            });
            ipc.server.start();
        } else {
            ipc.config.id += ('' + process.env.name);
            ipc.connectTo(options.appName, () => {
                console.log('connected!');
            });
            ipc.of[this.connectionName].on('messageReply', (msg: MessageReply, socket: Socket) => {
                console.log(msg);
            });
        }
    }
    messageHandler(message: Message, socket: Socket) {
        try {
            const dataMapIdx = this.getDataMapArrayIndex(message.key);
            if (dataMapIdx === -1) {
                ipc.server.emit(socket, "messageReply", this.getError(ErrorsEnum.improperKey, message));
                return;
            }
            switch (message.mode) {
                case undefined:
                case "equ": {
                    switch (message.op) {
                        case "set": {
                            this.dataMaps[dataMapIdx].set(message.key, message.data);
                            ipc.server.emit(socket, "messageReply", <MessageReply>{ op: 'setR', status: true });
                            break;
                        }
                        case "get": {
                            if (this.dataMaps[dataMapIdx].has(message.key)) {
                                ipc.server.emit(socket, "messageReply", <MessageReply>{
                                    op: "getR",
                                    key: message.key,
                                    mode: "equ",
                                    status: true,
                                    data: this.dataMaps[dataMapIdx].get(message.key)
                                });
                            } else {
                                ipc.server.emit(socket, "messageReply", <MessageReply>{
                                    op: "getR",
                                    key: message.key,
                                    mode: "equ",
                                    status: false,
                                    reason: this.wrapError(ErrorsEnum.noSuchKey)
                                });
                            }
                            break;
                        }
                    }
                    break;
                }
                case "stream": {

                    break;
                }
                default: {
                    ipc.server.emit(socket, "messageReply", this.getError(ErrorsEnum.invalidMode, message));
                    break;
                }
            }
        } catch (e) {
            ipc.server.emit(socket, "messageReply", this.getError(ErrorsEnum.unknownError, message, e.toString()));
        }
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
    getError(errorCode: ErrorsEnum, message?: Message, errorString?: string): MessageReply {
        return <MessageReply> {
            op: 'error',
            error: this.wrapError(errorCode, message, errorString)
        }
    }
    wrapError(errorCode: ErrorsEnum, message?: Message, errorString?: string): Errors {
        return <Errors> {
            error: ErrorsEnum[errorCode],
            errNo: errorCode,
            message,
            errorString
        };
    }
    set(key: string, data: any) {
        ipc.of[this.connectionName].emit('message', <Message>{
            op: "set",
            mode: "equ",
            data,
            key
        });
    }
    get(key: string) {
        ipc.of[this.connectionName].emit('message', <Message>{
            op: "get",
            mode: "equ",
            key
        });
    }
}
