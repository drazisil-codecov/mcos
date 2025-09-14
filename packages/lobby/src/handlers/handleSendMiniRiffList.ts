import { LegacyMessage, ServerLogger,  } from "rusty-motors-shared";
import { serializeString } from "rusty-motors-shared";
import { channelRecordSize, channels } from "./channels.js";
import { getServerLogger } from "rusty-motors-shared";
import { BytableMessage } from "@rustymotors/binary";

const chatChannelIds = [
	'01',
	'02',
	'03',
	'04',
	'05',
	'06',
	'07',
	'08',
	'09',
	'10',
	'11',
	'12',
	'13',
	'14',
	'15',
	'16',
	'17',
	'18',
	'19',
	'20',
]

export async function handleSendMiniRiffList({
	connectionId,
	message,
	log = getServerLogger("lobby.handleSendMiniRiffList"),
}: {
	connectionId: string;
	message: BytableMessage;
	log?: ServerLogger;
}): Promise<{
	connectionId: string;
	message: BytableMessage;
}> {
	log.debug("[${connectionId}] Handling NPS_SEND_MINI_RIFF_LIST");
	log.debug(`[${connectionId}] Received command: ${message.serialize().toString("hex")}`);

	const outgoingGameMessage = new LegacyMessage();
	outgoingGameMessage.setMessageId(1028); // NPS_SEND_MINI_RIFF_LIST

	// const resultSize = (channelRecordSize * channels.length - 12)
	const resultSize = (channelRecordSize * (channels.length + 20))

	const packetContent = Buffer.alloc(resultSize);

	let offset = 0;
	try {
		packetContent.writeUInt32BE(channels.length + 20, offset);
		offset += 4; // offset is 8

		// loop through the channels
		for (const channel of channels) {
			offset = serializeString(channel.name, packetContent, offset);

			packetContent.writeUInt32BE(channel.id, offset);
			offset += 4;
			packetContent.writeUInt16BE(channel.population, offset);
			offset += 2;
		}

		let lobbyId = 221

		for (const chatId of chatChannelIds) {
			offset = serializeString(`MCC${chatId}`, packetContent, offset);

			packetContent.writeUInt32BE(lobbyId, offset);
			offset += 4;
			packetContent.writeUInt16BE(2, offset);
			offset += 2;
			lobbyId++
		}

		outgoingGameMessage.setBuffer(packetContent);

		// Build the packet
		const packetResult = new BytableMessage();
		packetResult.setSerializeOrder([
			{ name: "data", field: "Buffer" },
		]);
		packetResult.deserialize(outgoingGameMessage.serialize());

		log.debug(`[${connectionId}] Sending response: ${packetResult.serialize().toString("hex")}`);

		return {
			connectionId,
			message: packetResult,
		};
	} catch (error) {
		const err = Error(
			`Error handling NPS_SEND_MINI_RIFF_LIST: ${String(error)}`,
		);
		err.cause = error;
		throw err;
	}
}