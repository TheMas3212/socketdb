
export type State = any;

export type MetaState<T extends State> = {
  state: T,
  lastUpdate: number,
  serial: number,
  deleted: boolean
};

export interface ServerToClientEvents<T extends State> {
  update: (databaseName: string, key: string, state: MetaState<T>) => void;
}

export interface ClientToServerEvents<T extends State> {
  register: (databaseName: string) => void;
  index: (databaseName: string, ack: indexAck) => void;
  retrieve: (datebaseName: string, key: string, ack: retrieveAck<T>) => void;
  create: (databaseName: string, key: string, data: MetaState<T>, ack: createAck<T>) => void;
  update: (datebaseName: string, key: string, data: MetaState<T>, ack: updateAck<T>) => void;
  delete: (databaseName: string, key: string, ack: deleteAck<T>) => void;
}

type indexAck = (keys: string[]) => void;
type retrieveAck<T extends State> = (exists: boolean | null, state: MetaState<T>) => void;
type createAck<T extends State> = (success: boolean | null, newState: MetaState<T>) => void;
type updateAck<T extends State> = (success: boolean | null, newState: MetaState<T>) => void;
type deleteAck<T extends State> = (success: boolean | null, newState: MetaState<T>) => void;

export type Mutator<T> = (state: T) => T;