import type { TaggedSocket } from "./socketUtility.js";
import {
    ServerPacket,
    type SerializableInterface,
} from "rusty-motors-shared-packets";
import { receiveTransactionsData } from "rusty-motors-transactions";
import * as Sentry from "@sentry/node";
import { getServerLogger, ServerLogger } from "rusty-motors-shared";

/**
 * Handles the routing of messages for the MCOTS (Motor City Online Transaction Server) ports.
 *
 * @param taggedSocket - The socket object that contains the tagged information for routing.
 */

export async function mcotsPortRouter({
    taggedSocket,
    log = getServerLogger('gateway.mcotsPortRouter'),
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

    log.debug(`[${id}] MCOTS port router started for port ${port}`);

    // Handle the socket connection here
    socket.on('data', async (data) => {
        await processIncomingPackets(data, log, id, port, taggedSocket);
    });

    socket.on('end', () => {
        // log.debug(`[${id}] Socket closed by client for port ${port}`);
    });

    socket.on('error', (error) => {
        if (error.message.includes('ECONNRESET')) {
            log.debug(`[${id}] Connection reset by client`);
            return;
        }
        log.error(`[${id}] Socket error: ${error}`);
    });
}

function findPackageSignatureIndices(data: Buffer): number[] {
    const packageSignature = Buffer.from('544f4d43', 'hex');
    const packageSignatureIndices: number[] = [];
    let index = 0;
    let currentIndex = 0;

    while (index !== -1) {
        index = data.indexOf(packageSignature, currentIndex);
        if (index !== -1) {
            packageSignatureIndices.push(index);
            currentIndex = index + 1;
        }
    }

    return packageSignatureIndices;
}

type messageQueueItem = {
    id: string,
    socket: TaggedSocket,
    data: Buffer<ArrayBufferLike>,
}

const inboundQueue: messageQueueItem[] = []

async function processIncomingPackets(
    data: Buffer<ArrayBufferLike>,
    log: ServerLogger,
    id: string,
    port: number,
    socket: TaggedSocket,
) {
    try {
        let inPackets: Buffer[] = [];

        log.debug(
            `[${id}] Received data in processIncomingPackets: ${data.toString('hex')}`,
        );

        /* Search for the package signature in the hex string
         * If found, split the data into packets
         * Each packet starts with the 2 bytes (16 bits) length of the packet
         * followed by the 4 bytes package signature
         */
        let indices = findPackageSignatureIndices(data);

        for (let indexOfPackageSignature of indices) {
            let length = data.readUInt16LE(indexOfPackageSignature - 2);
            let packet = data.subarray(
                indexOfPackageSignature - 2,
                indexOfPackageSignature + length,
            );
            log.debug(
                `Packet(hex): ${packet.toString('hex')}`,
                {
                    connectionId: id,
                    port,
                    length: length,
                    lengthAction: packet.length,
                },
            );
            inboundQueue.push({
                id: id,
                socket: socket,
                data: packet
            })
            inPackets.push(packet);
        }

        if (inPackets) {
            inboundQueue.shift()
            console.log('S: ==================================================================')
            console.dir(inPackets)
            console.log('E: ==================================================================')
        }


        log.warn(`[${id}] Received ${inPackets.length} packets`);

        for (let packet of inPackets) {
            log.debug(`[${id}] Received data: ${packet.toString('hex')}`);
            const initialPacket = parseInitialMessage(packet);
            log.debug(
                `initial Packet(hex): ${initialPacket.toHexString()}`,
                {
                    connectionId: id,
                    port,
                    seq: initialPacket.getSequence(),
                    length: initialPacket.getLength(),
                },
            );
            await routeInitialMessage(id, port, initialPacket)
                .then((response) => {
                    // Send the response back to the client
                    log.debug(
                        `[${id}] Sending response: ${response.toString('hex')}`,
                    );
                    socket.rawSocket.write(response);
                })
                .catch(error => {
                    throw new Error(
                        `[${id}] Error routing initial mcots message: ${error}`,
                        {
                            cause: error,
                        },
                    );
                });
        }
    } catch (error) {
        Sentry.captureException(error);
        log.error(`[${id}] Error handling data: ${error}`);
    }
}

function parseInitialMessage(data: Buffer): ServerPacket {
	const initialPacket = new ServerPacket();
	initialPacket.deserialize(data);
	return initialPacket;
}

async function routeInitialMessage(
	id: string,
	port: number,
	initialPacket: ServerPacket,
	log = getServerLogger("gateway.mcotsPortRouter/routeInitialMessage"),
): Promise<Buffer> {
	// Route the initial message to the appropriate handler
	// Messages may be encrypted, this will be handled by the handler

	log.debug(`Routing message for port ${port}: ${initialPacket.getMessageId()}`);
	let responses: SerializableInterface[] = [];

	switch (port) {
		case 43300:
			// Handle transactions packet
			responses = (
				await receiveTransactionsData({
					connectionId: id,
					message: initialPacket,
				})
			).messages;
			break;
		default:
			console.log(`No handler found for port ${port}`);
			break;
	}

	// Send responses back to the client
	log.debug(`[${id}] Sending ${responses.length} responses`);

	// Serialize the responses
	const serializedResponses = responses.map((response) => response.serialize());

	return Buffer.concat(serializedResponses);
}

const inWork: messageQueueItem[] = [];
const outWork: messageQueueItem[] = [];

const queues = [
    { name: "inWork", queue: inWork},
    { name: "outWork", queue: outWork}
]

async function doWork(item: messageQueueItem) {
  console.log(`Doing work ${item}`);
  await new Promise(resolve => setTimeout(resolve, 4, item));
}

async function handleWorkQueue(workQueue: {name: string, queue: messageQueueItem[]}) {
  while(true) {
    if(!workQueue.queue.length) {
      await new Promise(resolve => setTimeout(resolve, 0)); 
      continue;
    }; // No work, skipping
    const item = workQueue.queue.shift();
    console.log(`${workQueue.name} doing work ${item}`);
    console.log(`Doing work ${item}`);
    if ( typeof item !== "undefined") {
        await doWork(item);
    }
  }
}

// queues.forEach((q) => {
//     handleWorkQueue(q);

// })


// // randomly add items to the in and out queues
// setInterval(() => {
//   console.log('adding work');
//   inWork.push(Math.floor(Math.random() * 10));
//   outWork.push(Math.floor(Math.random() * 10));
// }, 1000);