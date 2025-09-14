export class ChatMessage {
    _serverName: string;
    _messageType: number;
    _senderId: number;
    _message: string;

    constructor(serverName: string, messageType: number, senderId: number, message: string) {
        this._serverName = serverName;
        this._messageType = messageType;
        this._senderId = senderId;
        this._message = message;
    }
}
