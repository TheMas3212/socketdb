import type * as socketio from 'socket.io-client';
import { State, ServerToClientEvents, ClientToServerEvents, MetaState, Mutator } from '@themas3212/socketdb-common';

export class SocketDatabase<T extends State> {
  private store: Map<string, MetaState<T>>;
  public constructor(readonly socket: socketio.Socket<ServerToClientEvents<T>, ClientToServerEvents<T>>, readonly databaseName: string) {
    this.store = new Map();
    socket.on('update', (dbName: string, key: string, state: MetaState<T>) => { if (this.databaseName === dbName) this.store.set(key, state); });
    socket.emit('register', this.databaseName);
  }
  public keys(): Promise<string[]> {
    return new Promise((resolve) => {
      this.socket.emit('index', this.databaseName, (keys: string[]) => {
        resolve(keys);
      });
    });
  }
  private _retrieve (key: string): Promise<MetaState<T> | null> {
    return new Promise((resolve, reject) => {
      this.socket.emit('retrieve', this.databaseName, key, (exists: boolean | null, state: MetaState<T>) => {
        if (exists === null) return reject(new Error(`Permission denied for retrieve on ${key}`));
        this.store.set(key, state);
        if (exists) {
          resolve(state);
        } else {
          resolve(null);
        }
      });
    });
  }
  public retrieve(key: string): Promise<T | null> {
    return new Promise((resolve) => {
      this._retrieve(key).then((mstate) => {
        if (mstate === null || mstate.deleted) {
          // TODO support retrieving deleted entries?
          return resolve(null);
        }
        resolve(mstate.state);
      });
    });
  }
  public create (key: string, initalState: T): Promise<T> {
    const cachedState = this.store.get(key);
    if (cachedState !== undefined && !cachedState.deleted) return Promise.reject(new Error(`Key already exists`));
    return new Promise((resolve, reject) => {
      const actualState: MetaState<T> = {
        state: initalState,
        lastUpdate: Date.now(),
        serial: 1,
        deleted: false
      };
      this.socket.emit('create', this.databaseName, key, actualState, (success: boolean | null, state: MetaState<T>) => {
        if (success === null) return reject(new Error(`Permission denied for create on ${key}`));
        if (success) {
          this.store.set(key, state);
          resolve(state.state);
        } else {
          reject(new Error(`Key already exists`));
        }
      });
    });
  }
  public update (key: string, mutator: Mutator<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const initalState = this.store.get(key);
      (initalState === undefined ? this._retrieve(key) : Promise.resolve(initalState)).then((currentState) => {
        if (currentState === null) return reject(new Error(`Requested update for nonexistent key: ${key}`));
        const tryUpdate = (currentState: MetaState<T>) => {
          const newState = {
            ...currentState,
            state: mutator(currentState.state),
            serial: currentState.serial + 1
          };
          this.socket.emit('update', this.databaseName, key, newState, (success: boolean | null, newState) => {
            if (success === null) return reject(new Error(`Permission denied for update on ${key}`));
            if (success) {
              this.store.set(key, newState);
              return resolve(newState.state);
            } else {
              tryUpdate(newState);
            }
          });
        };
        tryUpdate(currentState);
      });
    });
  }
  public delete (key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.socket.emit('delete', this.databaseName, key, (success: boolean | null, state: MetaState<T> | undefined) => {
        if (success === null) return reject(new Error(`Permission Failure on key: ${key}, op: delete`));
        if (state) this.store.set(key, state);
        resolve(success);
      });
    });
  }
}