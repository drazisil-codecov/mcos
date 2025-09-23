import { BytableMessage } from "@rustymotors/binary";
import {
    getServerLogger,
    ServerLogger,
} from "rusty-motors-shared";

export async function handleOpenCommChannel({
    connectionId,
    message,
    log = getServerLogger("lobby.handleOpenCommChannel"),
}: {
    connectionId: string;
    message: BytableMessage;
    log?: ServerLogger;
}): Promise<{
    connectionId: string;
    message: BytableMessage;
}> {
    try {
        log.debug(`[${connectionId}] Handling NPS_OPEN_COMM_CHANNEL`);
        log.debug(
            `[${connectionId}] Received command: ${message.header.messageId}`,
        );

        // l
        const incomingRequest = new BytableMessage();
        incomingRequest.setSerializeOrder([
            { name: "commId", field: "Dword" },
            { name: "riffName", field: "String" },
            { name: "slotNumber", field: "Dword" },
            { name: "slotFlags", field: "Dword" }
        ]);
        incomingRequest.deserialize(message.serialize());

        const requestedCommId = incomingRequest.getFieldValueByName("commId") ?? -1
        const requestedRiffName = incomingRequest.getFieldValueByName("riffName") ?? ""

        log.debug(
            `[${connectionId}] Requested we open a channel on ${requestedRiffName}(${(requestedCommId as Buffer).readInt32BE()})`,
        );

        // TODO: Actually have servers
        const packetResult = createNPSChannelGrantedPacket((requestedCommId as Buffer).readInt32BE(), 7003)
        log.debug(`[${connectionId}]  Sending comm GRANTED: ${JSON.stringify(packetResult)}`)


        return {
            connectionId,
            message: packetResult,
        };
    } catch (error) {
        const err = Error(
            `[${connectionId}] Error handling NPS_OPEN_COMM_CHANNEL: ${String(error)}`,
        );
        err.cause = error;
        throw err;
    }
}

export function createNPSChannelGrantedPacket(commId: number, commPort: number) {
            
        
        // ll
        const outgoingGameMessage = new BytableMessage();
        outgoingGameMessage.setSerializeOrder([
            { name: "commId", field: "Dword" },
            { name: "port", field: "Dword" },
        ]);

        outgoingGameMessage.header.setMessageId(0x214);
        outgoingGameMessage.setVersion(0);
        outgoingGameMessage.setFieldValueByName("commId", commId);
        outgoingGameMessage.setFieldValueByName(
            "port",
            commPort
        );

        // Build the packet
        const packetResult = new BytableMessage();
        packetResult.setSerializeOrder([
            { name: "data", field: "Buffer" },
        ]);
        packetResult.setVersion(0);
        packetResult.deserialize(outgoingGameMessage.serialize());

        return packetResult

}