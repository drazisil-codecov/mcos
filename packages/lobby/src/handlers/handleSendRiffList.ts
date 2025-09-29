import { RiffInfoListMessage, ServerLogger, } from "rusty-motors-shared";
import { getServerLogger } from "rusty-motors-shared";
import { BytableMessage } from "@rustymotors/binary";

export async function handleSendRiffList({
    connectionId,
    message,
    log = getServerLogger("lobby.handleSendRiffList"),
}: {
    connectionId: string;
    message: BytableMessage;
    log?: ServerLogger;
}): Promise<{
    connectionId: string;
    message: BytableMessage;
}> {
    log.debug("[${connectionId}] Handling NPS_SEND_RIFF_LIST");
    log.debug(`[${connectionId}] Received command: ${message.header.messageId}`);

    const outgoingGameMessage = new RiffInfoListMessage();
    outgoingGameMessage.id = 0x401; // NPS_RIFF_LIST

    // Build the packet
    const packetResult = new BytableMessage();
    packetResult.setSerializeOrder([
        { name: "data", field: "Buffer" },
    ]);
    packetResult.deserialize(outgoingGameMessage.serialize());

    try {
        return {
            connectionId,
            message: packetResult,
        };
    } catch (error) {
        const err = Error(
            `Error handling NPS_SEND_RIFF_LIST: ${String(error)}`,
        );
        err.cause = error;
        throw err;
    }
}