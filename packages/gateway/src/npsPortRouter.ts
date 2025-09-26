import type { TaggedSocket } from "../../shared/src/types.js";
import {
	GamePacket,
	type SerializableInterface,
} from 'rusty-motors-shared-packets';
import { receiveLobbyData } from 'rusty-motors-lobby';
import { receivePersonaData } from 'rusty-motors-personas';
import { receiveLoginData } from 'rusty-motors-login';
import {receiveChatData} from "rusty-motors-chat"
import { BytableMessage, createRawMessage } from '@rustymotors/binary';
import * as Sentry from '@sentry/node';
import { getServerLogger, messageQueueItem, ServerLogger } from 'rusty-motors-shared';
import { MessageQueue } from './MessageQueue.js';

/**
 * Handles routing for the NPS (Network Play System) ports.
 *
 * @param taggedSocket - The socket connection with associated metadata to be routed.
 *
 * @remark If the socket's local port is undefined, the connection is closed immediately. On port 7003, an "ok to login" packet is sent upon connection.
 */

export async function npsPortRouter({
	taggedSocket,
	log = getServerLogger("gateway.npsPortRouter"),
}: {
	taggedSocket: TaggedSocket;
	log?: ServerLogger;
}): Promise<void> {
	const { rawSocket: socket, connectionId: id } = taggedSocket;

	const port = socket.localPort || 0;

	if (port === 0) {
		log.error(`[${id}] Local port is undefined`);
		socket.end();
		return;
	}
	log.debug(`[${id}] NPS port router started for port ${port}`);
	const receiveQueue = new MessageQueue("npsIn", 10, async (item: messageQueueItem) => {
		try {
			await processSocketData(item.data, log, taggedSocket.connectionId, taggedSocket.localPort, taggedSocket)
		} catch (err) {
			console.error(`Error processing item: ${err}`)
		}
	})



	// TODO: Document this
	if (port === 7003) {
		// Sent ok to login packet
		log.debug(`[${id}] Sending ok to login packet`);
		socket.write(Buffer.from([0x02, 0x30, 0x00, 0x04]));
	}

	// Handle the socket connection here
	socket.on('data', async (data) => {
		receiveQueue.put({
			id: -1,
			socket: taggedSocket,
			data
		});
	})

	socket.on('end', () => {
		receiveQueue.exit()
	});

	socket.on("error", (error) => {
		if (error.message.includes("ECONNRESET")) {
			log.debug(`[${id}] Connection reset by client`);
			return;
		}
		log.error(`[${id}] Socket error: ${error}`);
	});
}

/**
 * Processes incoming socket data, splits it into packets if necessary, and routes
 * the initial message for further handling. Sends the response back to the client
 * through the socket.
 *
 * @param log - The logger instance used for logging debug, warning, and error messages.
 * @param id - A unique identifier for the current connection or session.
 * @param port - The port number associated with the socket connection.
 * @param socket - The socket instance used for communication with the client.
 * @returns A function that processes incoming data buffers from the socket.
 *
 * The returned function:
 * - Logs the received data and its length.
 * - Splits the data into packets based on a predefined separator if multiple packets are detected.
 * - Parses the initial message from each packet.
 * - Routes the initial message and sends the response back to the client.
 * - Handles errors during parsing, routing, or response sending, logging them appropriately.
 */
async function processSocketData(
	data: Buffer<ArrayBufferLike>,
	log: ServerLogger,
	id: string,
	port: number,
	socket: TaggedSocket,
): Promise<void> {
	try {
		log.debug(`[${id}] Received data: ${data.toString('hex')}`);
		log.debug(`[${id}] Data length: ${data.length}`);

		const separator = Buffer.from([0x11, 0x01]);
		const packets = splitDataIntoPackets(data, separator, log, id);

		if (packets.length) {
			console.log('S: ==================================================================')
			console.dir(packets)
			console.log('E: ==================================================================')
		}

		for (const packet of packets) {
			log.debug(`raw packet: ${packet.toString("hex")}`)
			if (packet.byteLength === 0) {
				log.warn(`BUG: We recieved an empty packet from the splitter`)
				continue
			}
			const initialPacket = parseInitialMessage(packet);
			await handlePacketRouting(id, port, initialPacket, socket, log);
		}
	} catch (error) {
		handleSocketError(error, log, id);
	}

}

function splitDataIntoPackets(
	data: Buffer,
	separator: Buffer,
	log: ServerLogger,
	id: string,
): Buffer[] {
	const packetsArray = data.toString('hex').split(separator.toString('hex'))
	const packetCount =
		packetsArray.length - 1;
	log.debug(`[${id}] Number of packets: ${packetCount}`);

	if (packetCount > 1) {
		log.debug(`[${id}] ${packetCount} packets detected`);
		let packets = packetsArray.map((packet: string) => {
			if (packet.length > 0) {
				return Buffer.concat([Buffer.from([0x11, 0x01]), Buffer.from(packet, "hex")])
			}
			return Buffer.alloc(0)
		})
		packets = packets.filter((packet: Buffer | undefined) => {
			return packet && packet.byteLength > 2
		})
		log.debug(
			`[${id}] Split packets: ${packets.map((p) => p.toString('hex'))}`,
		);
		return packets as Buffer[]
	} else {
		log.debug(`[${id}] One packet detected`);
		return [data];
	}
}

async function handlePacketRouting(
	id: string,
	port: number,
	initialPacket: BytableMessage,
	socket: TaggedSocket,
	log: ServerLogger,
): Promise<void> {
	try {
		const response = await routeInitialMessage(id, port, initialPacket);
		log.debug(
			`[${id}] Sending response to socket: ${response.toString('hex')}`,
		);
		socket.rawSocket.write(response);
	} catch (error) {
		throw new Error(`[${id}] Error routing initial nps message: ${error}`, {
			cause: error,
		});
	}
}

function handleSocketError(error: unknown, log: ServerLogger, id: string): void {
	if (error instanceof RangeError) {
		log.warn(`[${id}] Error parsing initial nps message: ${error}`);
	} else {
		Sentry.captureException(error);
		log.error(`[${id}] Error handling data: ${error}`);
	}
}

/**
 * Parses a raw buffer into a `BytableMessage` representing the initial game packet.
 *
 * Sets the message version based on the packet ID, then deserializes the buffer into a message object.
 *
 * @param data - The buffer containing the raw initial message.
 * @returns The parsed `BytableMessage` object.
 *
 * @throws {Error} If the buffer cannot be parsed into a valid message.
 */
function parseInitialMessage(data: Buffer): BytableMessage {
	try {
		const message = createRawMessage();
		message.setVersion(1);

		// There are a few messages here that need special handling due to length
		const id = data.readUInt16BE(0);
		if ([0x217, 0x532].includes(id)) {
			message.setVersion(0);
		}

		message.deserialize(data);

		return message;
	} catch (error) {
		const err = new Error(`Error parsing initial message: ${error}`, {
			cause: error,
		});
		getServerLogger("gateway.npsPortRouter/parseInitialMessage").error(
			(err as Error).message,
		);
		throw err;
	}
}

/**
 * Routes the initial message to the appropriate handler based on the port number.
 * Handles different types of packets such as lobby data, login data, chat data, and persona data.
 * Logs the routing process and the number of responses sent back to the client.
 *
 * @param id - The connection ID of the client.
 * @param port - The port number to determine the type of packet.
 * @param initialPacket - The initial packet received from the client.
 * @param log - The logger to use for logging messages.
 * @returns A promise that resolves to a Buffer containing the serialized responses.
 */
async function routeInitialMessage(
	id: string,
	port: number,
	initialPacket: BytableMessage,
	log = getServerLogger("gateway.npsPortRouter/routeInitialMessage"),
): Promise<Buffer> {
	// Route the initial message to the appropriate handler
	// Messages may be encrypted, this will be handled by the handler

	log.debug(`Routing message for port ${port}: ${initialPacket.header.messageId}`);

	const packet = new GamePacket();
	packet.deserialize(initialPacket.serialize());

	let responses: SerializableInterface[] = [];

	let wasHandled = false

	if (port > 9000 && port < 9021) {
		log.debug(
			`[${id}] Passing room packet to lobby handler: ${packet.getMessageId()}`,
		);
		responses = (
			await receiveLobbyData({ connectionId: id, message: initialPacket })
		).messages;
		log.debug(`[${id}] Received ${responses.length} room lobby response packets`);
		wasHandled = true
	}

	switch (port) {
		case 7003:
			// Handle lobby packet
			log.debug(
				`[${id}] Passing packet to lobby handler: ${packet.getMessageId()}`,
			);
			responses = (
				await receiveLobbyData({ connectionId: id, message: initialPacket })
			).messages;
			log.debug(`[${id}] Received ${responses.length} lobby response packets`);
			wasHandled = true
			break;
		case 8226:
			// Handle login packet
			responses = (
				await receiveLoginData({ connectionId: id, message: initialPacket })
			).messages;
			log.debug(`[${id}] Received ${responses.length} login response packets`);
			wasHandled = true
			break;
		case 8227:
			// Handle chat packet
			log.debug(
				`[${id}] Passing packet to chat handler: ${packet.serialize().toString("hex")}`,
			);
			responses = (await receiveChatData({ connectionId: id, message: packet }))
				.messages;
			log.debug(`[${id}] Chat Responses: ${responses.map((r) => r.serialize().toString("hex"))}`);
			break;
		case 8228:
			log.debug(
				`[${id}] Passing packet to persona handler: ${packet.serialize().toString("hex")}`,
			);
			// responses =Handle persona packet
			responses = (
				await receivePersonaData({ connectionId: id, message: packet })
			).messages;
			log.debug(`[${id}] Received ${responses.length} persona response packets`);
			wasHandled = true
			break;
		case 10001:
			log.debug(
				`[${id}] Passing race? packet to lobby handler: ${packet.getMessageId()}`,
			);
			responses = (
				await receiveLobbyData({ connectionId: id, message: initialPacket })
			).messages;
			log.debug(`[${id}] Received ${responses.length} race? lobby response packets`);
			wasHandled = true
			break;

		default:
			// No handler
			if (wasHandled === false) {

				log.warn(
					`${id}] No handler found for port ${port}: ${packet.serialize().toString("hex")}`,
				);
			}
			break;
	}

	// Send responses back to the client
	log.debug(`[${id}] Sending ${responses.length} responses`);

	// Serialize the responses
	const serializedResponses = responses.map((response) => response.serialize());

	return Buffer.concat(serializedResponses);
}