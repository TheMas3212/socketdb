"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketDatabase = void 0;
class SocketDatabase {
    constructor(socket, databaseName) {
        this.socket = socket;
        this.databaseName = databaseName;
        this.store = new Map();
        socket.on('update', (dbName, key, state) => { if (this.databaseName === dbName)
            this.store.set(key, state); });
        socket.emit('register', this.databaseName);
    }
    _retrieve(key) {
        return new Promise((resolve, reject) => {
            this.socket.emit('retrieve', this.databaseName, key, (exists, state) => {
                if (exists === null)
                    return reject(new Error(`Permission denied for retrieve on ${key}`));
                this.store.set(key, state);
                if (exists) {
                    resolve(state);
                }
                else {
                    resolve(null);
                }
            });
        });
    }
    retrieve(key) {
        return new Promise((resolve) => {
            this._retrieve(key).then((mstate) => {
                if (mstate === null || mstate.deleted) {
                    return resolve(null);
                }
                resolve(mstate.state);
            });
        });
    }
    create(key, initalState) {
        const cachedState = this.store.get(key);
        if (cachedState !== undefined && !cachedState.deleted)
            return Promise.reject(new Error(`Key already exists`));
        return new Promise((resolve, reject) => {
            const actualState = {
                state: initalState,
                lastUpdate: Date.now(),
                serial: 1,
                deleted: false
            };
            this.socket.emit('create', this.databaseName, key, actualState, (success, state) => {
                if (success === null)
                    return reject(new Error(`Permission denied for create on ${key}`));
                if (success) {
                    this.store.set(key, state);
                    resolve(state.state);
                }
                else {
                    reject(new Error(`Key already exists`));
                }
            });
        });
    }
    update(key, mutator) {
        return new Promise((resolve, reject) => {
            const initalState = this.store.get(key);
            (initalState === undefined ? this._retrieve(key) : Promise.resolve(initalState)).then((currentState) => {
                if (currentState === null)
                    return reject(new Error(`Requested update for nonexistent key: ${key}`));
                const tryUpdate = (currentState) => {
                    const newState = Object.assign(Object.assign({}, currentState), { state: mutator(currentState.state), serial: currentState.serial + 1 });
                    this.socket.emit('update', this.databaseName, key, newState, (success, newState) => {
                        if (success === null)
                            return reject(new Error(`Permission denied for update on ${key}`));
                        if (success) {
                            this.store.set(key, newState);
                            return resolve(newState.state);
                        }
                        else {
                            tryUpdate(newState);
                        }
                    });
                };
                tryUpdate(currentState);
            });
        });
    }
    delete(key) {
        return new Promise((resolve, reject) => {
            this.socket.emit('delete', this.databaseName, key, (success, state) => {
                if (success === null)
                    return reject(new Error(`Permission Failure on key: ${key}, op: delete`));
                if (state)
                    this.store.set(key, state);
                resolve(success);
            });
        });
    }
}
exports.SocketDatabase = SocketDatabase;
//# sourceMappingURL=index.js.map