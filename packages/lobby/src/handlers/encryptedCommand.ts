import {
	fetchStateFromDatabase,
	getEncryption,
	SerializedBufferOld,
	ServerLogger,
	updateEncryption,
} from "rusty-motors-shared";
import { getServerLogger } from "rusty-motors-shared";
import { BytableMessage, createRawMessage } from "@rustymotors/binary";
import { npsCommandHandlers } from "./npsCommandHandlers.js";

/**
 * Array of supported command handlers
 *
 * @type {{
 *  opCode: number,
 * name: string,
 * handler: (args: {
 * connectionId: string,
 * message: BytableMessage,
 * log: ServerLogger,
 * }) => Promise<{
 * connectionId: string,
 * messages: BytableMessage[],
 * }>}[]}
 */
export const messageHandlers: {
	opCode: number;
	name: string;
	handler: (args: {
		connectionId: string;
		message: BytableMessage;
		log: ServerLogger;
	}) => Promise<{
		connectionId: string;
		messages: BytableMessage[];
	}>;
}[] = [];

/**
 * Takes an plaintext command packet and return the encrypted bytes
 *
 * @param {object} args
 * @param {string} args.connectionId
 * @param {LegacyMessage | MessageBuffer} args.message
 * @param {ServerLogger} [args.log] Logger
 * @returns {Promise<{
 * connectionId: string,
 * message: LegacyMessage | MessageBuffer,
 * }>}
 */
async function encryptCmd({
	connectionId,
	message,
}: {
	connectionId: string;
	message: BytableMessage;
	log?: ServerLogger;
}): Promise<{
	connectionId: string;
	message: BytableMessage;
}> {
	const state = fetchStateFromDatabase();

	const encryption = getEncryption(state, connectionId);

	if (typeof encryption === "undefined") {
		throw Error(
			`Unable to locate encryption session for connection id ${connectionId}`,
		);
	}

	let precriptedMessage = message.serialize();

	if (precriptedMessage.length % 8 !== 0) {
		const padding = Buffer.alloc(8 - (precriptedMessage.length % 8));
		precriptedMessage = Buffer.concat([precriptedMessage, padding]);
	}

	const result = encryption.commandEncryption.encrypt(precriptedMessage);
	updateEncryption(state, encryption).save();

	const encryptedMessage = createRawMessage();
	encryptedMessage.header.setMessageId(0x1101);
	encryptedMessage.setBody(result);

	return {
		connectionId,
		message: encryptedMessage,
	};
}

/**
 * Takes an encrypted command packet and returns the decrypted bytes
 *
 * @param {object} args
 * @param {string} args.connectionId
 * @param {LegacyMessage} args.message
 * @param {ServerLogger} [args.log=getServerLogger({ name: "Lobby" })]
 * @returns {Promise<{
 *  connectionId: string,
 * message: LegacyMessage,
 * }>}
 */
async function decryptCmd({
	connectionId,
	message,
}: {
	connectionId: string;
	message: BytableMessage;
}): Promise<{
	connectionId: string;
	message: BytableMessage;
}> {
	const state = fetchStateFromDatabase();

	const encryption = getEncryption(state, connectionId);

	if (typeof encryption === "undefined") {
		throw Error(
			`Unable to locate encryption session for connection id ${connectionId}`,
		);
	}

	const result = encryption.commandEncryption.decrypt(message.getBody());

	updateEncryption(state, encryption).save();

	const decipheredMessage = createRawMessage(result)

	return {
		connectionId,
		message: decipheredMessage,
	};
}

export type NpsCommandHandler = {
	opCode: number;
	name: string;
	handler: (args: {
		connectionId: string;
		message: BytableMessage;
		log?: ServerLogger;
	}) => Promise<{
		connectionId: string;
		message: BytableMessage;
	}>;
};

async function handleCommand({
	connectionId,
	message,
	log = getServerLogger( "lobby.handleCommand"),
}: {
	connectionId: string;
	message: BytableMessage;
	log?: ServerLogger;
}): Promise<{
	connectionId: string;
	message: BytableMessage;
}> {
	const command = message.header.messageId;

	// What is the command?
	log.debug(`[${connectionId}] Received Command: ${command}`);
	log.debug(`[${connectionId}] Received Command message: ${message.serialize().toString("hex")}`);

	const handler = npsCommandHandlers.find((h) => h.opCode === command);

	if (typeof handler === "undefined") {
		throw Error(`Unknown command: ${command}`);
	}

	const {message: response} = await handler.handler({

		connectionId,
		message,
	});

	log.debug(`[${connectionId}] Sending response: ${response.header.messageId}`);

	return {
		connectionId,
		message: response,
	};
}

/**
 *
 *
 * @param {object} args
 * @param {string} args.connectionId
 * @param {BytableMessage} args.message
 * @param {ServerLogger} [args.log=getServerLogger({ name: "Lobby" })]
  * @returns {Promise<{
*  connectionId: string,
* messages: SerializedBufferOld[],
* }>}

 */
export async function handleEncryptedNPSCommand({
	connectionId,
	message,
	log = getServerLogger( "lobby.handleEncryptedNPSCommand"),
}: {
	connectionId: string;
	message: BytableMessage;
	log?: ServerLogger;
}): Promise<{
	connectionId: string;
	messages: SerializedBufferOld[];
}> {
	log.debug(`[${connectionId}] Received encrypted command: ${message.header.messageId}`);

	// Decipher
	const decipheredMessage = await decryptCmd({
		connectionId,
		message,
	});

	log.debug(`[${connectionId}] Deciphered command: ${decipheredMessage.message.header.messageId}`);

	const response = await handleCommand({
		connectionId,
		message: decipheredMessage.message,
	});

	if (response.message === null) {
		log.debug(`[${connectionId}] No response to send`);
		return {
			connectionId,
			messages: [],
		};
	}

	log.debug(`[${connectionId}] Sending response: ${response.message.header.messageId}`);

	// Encipher
	const result = await encryptCmd({
		connectionId,
		message: response.message,
	});

	const encryptedResponse = result.message;

	const outPacket = new SerializedBufferOld()
	outPacket.deserialize(encryptedResponse.serialize())

	return {
		connectionId,
		messages: [outPacket],
	};
}