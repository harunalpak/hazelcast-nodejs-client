import * as Long from 'long';
import ClientConnection = require('./ClientConnection');
import {ListenerMessageCodec} from '../ListenerMessageCodec';

export class ClientEventRegistration {
    readonly serverRegistrationId: string;
    readonly correlationId: Long;
    readonly subscriber: ClientConnection;
    readonly codec: ListenerMessageCodec;

    constructor(serverRegistrationId: string, correlationId: Long, subscriber: ClientConnection, codec: ListenerMessageCodec) {
        this.serverRegistrationId = serverRegistrationId;
        this.correlationId = correlationId;
        this.subscriber = subscriber;
        this.codec = codec;
    }

    toString(): string {
        return this.serverRegistrationId;
    }
}
