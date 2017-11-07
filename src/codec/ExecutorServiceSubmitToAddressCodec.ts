/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {AddressCodec} from './AddressCodec';
import {UUIDCodec} from './UUIDCodec';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {EntryViewCodec} from './EntryViewCodec';
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');
import {ExecutorServiceMessageType} from './ExecutorServiceMessageType';

var REQUEST_TYPE = ExecutorServiceMessageType.EXECUTORSERVICE_SUBMITTOADDRESS;
var RESPONSE_TYPE = 105;
var RETRYABLE = false;


export class ExecutorServiceSubmitToAddressCodec {


    static calculateSize(name: string, uuid: string, callable: Data, address: Address) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeString(uuid);
        dataSize += BitsUtil.calculateSizeData(callable);
        dataSize += BitsUtil.calculateSizeAddress(address);
        return dataSize;
    }

    static encodeRequest(name: string, uuid: string, callable: Data, address: Address) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, uuid, callable, address));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendString(uuid);
        clientMessage.appendData(callable);
        AddressCodec.encode(clientMessage, address);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        // Decode response from client message
        var parameters: any = {
            'response': null
        };


        if (clientMessage.readBoolean() !== true) {
            parameters['response'] = toObjectFunction(clientMessage.readData());
        }

        return parameters;
    }


}
