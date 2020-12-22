import {EventEmitter} from 'events';
import {MessageReply} from './types';

type Arguments<T> = [T] extends [(...args: infer U) => any] ? U : [T] extends [void] ? [] : [T]

interface TypedEvents<Events> {
	addListener<E extends keyof Events> (event: E, listener: Events[E]): this,
	on<E extends keyof Events> (event: E, listener: Events[E]): this,
	once<E extends keyof Events> (event: E, listener: Events[E]): this,
	prependListener<E extends keyof Events> (event: E, listener: Events[E]): this,
	prependOnceListener<E extends keyof Events> (event: E, listener: Events[E]): this,
	off<E extends keyof Events>(event: E, listener: Events[E]): this,
	removeAllListeners<E extends keyof Events> (event?: E): this,
	removeListener<E extends keyof Events> (event: E, listener: Events[E]): this,
	emit<E extends keyof Events> (event: E, ...args: Arguments<Events[E]>): boolean,
	eventNames (): (keyof Events | string | symbol)[],
	rawListeners<E extends keyof Events> (event: E): Function[],
	listeners<E extends keyof Events> (event: E): Function[],
	listenerCount<E extends keyof Events> (event: E): number,
	getMaxListeners (): number,
	setMaxListeners (maxListeners: number): this
}

interface InternalEventTypes {
	reply: (id: number, reply: MessageReply) => void;
}

type listenHandler = Map<string, Function>;

class InternalEvents extends (EventEmitter as new () => TypedEvents<InternalEventTypes>) {
	private readonly replyListeners: listenHandler = new Map();
	constructor() {
		super();
	}
	listener<E extends keyof InternalEventTypes>(event: string, args: number[], listener: InternalEventTypes[E]): this {
		switch (event) {
			case "reply": {
				if (this.replyListeners.has(`${event}:${args[0]}`)) {
					throw new Error(`${event}:${args[0]} already exists!`);
				}
				this.replyListeners.set(`${event}:${args[0]}`, listener);
				return this.addListener<any>(`${event}:${args[0]}`, listener);
			}
		}
		return this;
	}
	delete<E extends keyof InternalEventTypes>(event: E, args: number[], listener?: InternalEventTypes[E]): this {
		switch (event) {
			case "reply": {
				if (!this.replyListeners.has(`${event}:${args[0]}`)) {
					throw new Error(`${event}:${args[0]} does not exist!`);
				}
				const func = this.replyListeners.get(`${event}:${args[0]}`);
				this.replyListeners.delete(`${event}:${args[0]}`);
				return this.removeListener<any>(`${event}:${args[0]}`, func);
			}
		}
		return this;
	}
	emitter<E extends keyof InternalEventTypes>(event: E, emitArgs: number[], ...args: Arguments<InternalEventTypes[E]>): boolean {
		try {
			switch (event) {
				case "reply": {
					this.emit<any>(`${event}:${emitArgs[0]}`, ...args);
					break;
				}
			}
		} catch (e) {
			return false;
		}
		return true;
	}
	handleOnce<E extends keyof InternalEventTypes>(event: E, args: number[], listener: InternalEventTypes[E]): this {
		switch (event) {
			case "reply": {
				return this.once<any>(`${event}:${args[0]}`, listener);
			}
		}
		return this;
	}
}

export {
	TypedEvents,
	InternalEvents
};
