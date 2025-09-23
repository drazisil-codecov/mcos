import { handleEncryptedNPSCommand } from './encryptedCommand.js';
import { _npsRequestGameConnectServer } from './requestConnectGameServer.js';

export const handlerMap = [
    {
        opCode: 100,
        name: 'Connect game server',
        handler: _npsRequestGameConnectServer,
    },
    {
        opCode: 1101,
        name: 'Encrypted command',
        handler: handleEncryptedNPSCommand,
    },
];
