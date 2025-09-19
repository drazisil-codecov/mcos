import { BytableMessage } from "@rustymotors/binary";
import {
    getServerLogger,
    ServerLogger,
} from "rusty-motors-shared";
import { databaseManager } from "rusty-motors-database";
import { UserInfo } from "../UserInfoMessage.js";

export async function handleGetUserList({
    connectionId,
    message,
    log = getServerLogger("lobby.handleGetUserList"),
}: {
    connectionId: string;
    message: BytableMessage;
    log?: ServerLogger;
}): Promise<{
    connectionId: string;
    message: BytableMessage;
}> {
    try {
        log.debug(`[${connectionId}] Handling NPS_GET_USER_LIST`);
        log.debug(
            `[${connectionId}] Received command: ${message.header.messageId}`,
        );

        // l
        const incomingRequest = new BytableMessage();
        incomingRequest.setSerializeOrder([
            { name: "commId", field: "Dword" },
        ]);
        incomingRequest.deserialize(message.serialize());

        const requestedCommId = incomingRequest.getFieldValueByName("commId") ?? -1

        log.debug(
            `[${connectionId}] Requested we send the user list for channel ${(requestedCommId as Buffer).readInt32BE()}`,
        );

        // TODO: Actually have servers

        // ll
        const outgoingGameMessage = new BytableMessage();
        outgoingGameMessage.setSerializeOrder([
            { name: "commId", field: "Dword" },
            { name: "userCount", field: "Dword" },
            { name: "usersList", field: "Buffer"}
        ]);

        outgoingGameMessage.header.setMessageId(0x211);
        outgoingGameMessage.setVersion(0);
        outgoingGameMessage.setFieldValueByName("commId", requestedCommId);
        
        const userList: UserInfo[] = []
        
        const user1 = new UserInfo()
        user1._userId = 21,
        user1._userName = "Dr Brown"
        user1._userData.deserialize(await databaseManager.getUser(21)?? Buffer.alloc(64))

        log.debug(`Fetched userData: ${user1._userData.toString()}`)

        userList.push(user1)
        
        
        outgoingGameMessage.setFieldValueByName(
            "userCount",
            userList.length
        );

        let users = Buffer.alloc(0)

        for (const user of userList) {
            users = Buffer.concat([users, user.serialize()])
        }

        outgoingGameMessage.setFieldValueByName("usersList", users)

        log.debug(
            `[${connectionId}] Sending response[string]: ${outgoingGameMessage.toString()}`,
        );
        // Build the packet
        const packetResult = new BytableMessage();
        packetResult.setSerializeOrder([
            { name: "data", field: "Buffer" },
        ]);
        packetResult.setVersion(0);
        packetResult.deserialize(outgoingGameMessage.serialize());

        return {
            connectionId,
            message: packetResult,
        };
    } catch (error) {
        const err = Error(
            `[${connectionId}] Error handling NPS_GET_USER_LIST: ${String(error)}`,
        );
        err.cause = error;
        throw err;
    }
}