import { BytableMessage } from "@rustymotors/binary";
import {
	getServerLogger,
	ServerLogger,
} from "rusty-motors-shared";
import { chatChannelIds } from "./channels.js";

export async function handleGetServerInfo({
	connectionId,
	message,
	log = getServerLogger("lobby.handleGetServerInfo"),
}: {
	connectionId: string;
	message: BytableMessage;
	log?: ServerLogger;
}): Promise<{
	connectionId: string;
	message: BytableMessage;
}> {
	try {
		log.debug(`[${connectionId}] Handling NPS_GET_SERVER_INFO`);
		log.debug(
			`[${connectionId}] Received command: ${message.header.messageId}`,
		);

		// l
		const incomingRequest = new BytableMessage();
		incomingRequest.setSerializeOrder([{ name: "commId", field: "Dword" }]);
		incomingRequest.deserialize(message.serialize());

		const requestedCommId = incomingRequest.getFieldValueByName("commId") ?? -1

		const cID = (requestedCommId as Buffer).readInt32BE()

		log.debug(
			`[${connectionId}] Received commId: ${cID}`,
		);

		// TODO: Actually have servers
		let commPort;

		if (cID > 0 && cID < 21) {
			commPort = chatChannelIds[cID-1] ?? 7003
		}

		// plplll
		const outgoingGameMessage = new BytableMessage();
		outgoingGameMessage.setSerializeOrder([
			{ name: "riffName", field: "String" },
			{ name: "commId", field: "Dword" },
			{ name: "ipAddress", field: "String" },
			{ name: "port", field: "Dword" },
			{ name: "userId", field: "Dword" },
			{ name: "playerCount", field: "Dword" },
		]);

		outgoingGameMessage.header.setMessageId(525);
        outgoingGameMessage.setVersion(0);
		outgoingGameMessage.setFieldValueByName("riffName", `MCC${commPort}\n`);
		outgoingGameMessage.setFieldValueByName("commId", requestedCommId);
		outgoingGameMessage.setFieldValueByName(
			"ipAddress",
			"71.186.155.248\n",
		);
		outgoingGameMessage.setFieldValueByName(
			"port",
			parseInt(`90${commPort}`)
		);
		outgoingGameMessage.setFieldValueByName("userId", 21);
		outgoingGameMessage.setFieldValueByName("playerCount", 1);

		// Build the packet
		const packetResult = new BytableMessage();
		packetResult.setSerializeOrder([
			{ name: "data", field: "Buffer" },
		]);
		packetResult.setVersion(0);
		packetResult.deserialize(outgoingGameMessage.serialize());

		log.debug(
			`[${connectionId}] Sending response[serialize2]: ${packetResult.serialize().toString("hex")}`,
		);

		return {
			connectionId,
			message: packetResult,
		};
	} catch (error) {
		const err = Error(
			`[${connectionId}] Error handling NPS_GET_SERVER_INFO: ${String(error)}`,
		);
		err.cause = error;
		throw err;
	}
}