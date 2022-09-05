import type * as socketio from 'socket.io-client';
import { State, ServerToClientEvents, ClientToServerEvents, Mutator } from '@themas3212/socketdb-common';
export declare class SocketDatabase<T extends State> {
    readonly socket: socketio.Socket<ServerToClientEvents<T>, ClientToServerEvents<T>>;
    readonly databaseName: string;
    private store;
    constructor(socket: socketio.Socket<ServerToClientEvents<T>, ClientToServerEvents<T>>, databaseName: string);
    private _retrieve;
    retrieve(key: string): Promise<T | null>;
    create(key: string, initalState: T): Promise<T>;
    update(key: string, mutator: Mutator<T>): Promise<T>;
    delete(key: string): Promise<boolean>;
}
