import type { Socket } from "node:net";
import { TaggedSocket } from "rusty-motors-shared";

/**
 * Tags a socket with an ID and a connection timestamp.
 *
 * @param rawSocket - The socket to be tagged.
 * @param connectedAt - The timestamp of the connection.
 * @param connectionId - The unique identifier to tag the socket with.
 * @returns An object containing the id, socket, and connectionStamp.
 */

export function tagSocket(
	rawSocket: Socket,
	connectedAt: number,
	connectionId: string,
	localPort: number
): TaggedSocket {
	return {
		connectionId,
		rawSocket,
		connectedAt,
		localPort
	};
}

/**
 * Attempts to write data to a socket and returns a promise that resolves when the write is successful,
 * or rejects if an error occurs during the write operation.
 *
 * @param socket - The tagged socket to which the data will be written.
 * @param data - The string data to be written to the socket.
 * @returns A promise that resolves when the data is successfully written, or rejects with an error if the write fails.
 */
export async function trySocketWrite(socket: TaggedSocket, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
        socket.rawSocket.write(data, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}
