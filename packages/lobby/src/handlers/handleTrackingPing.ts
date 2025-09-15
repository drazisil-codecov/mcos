import { BytableMessage } from "@rustymotors/binary";
import { SerializedBufferOld, ServerLogger } from "rusty-motors-shared";
import { getServerLogger } from "rusty-motors-shared";

const defaultLogger = getServerLogger("Lobby");

export async function handleTrackingPing({
	connectionId,
	message,
	log = defaultLogger,
}: {
	connectionId: string;
	message: BytableMessage;
	log?: ServerLogger;
}): Promise<{
	connectionId: string;
	messages: SerializedBufferOld[];
}> {
	return {
		connectionId,
		messages: [],
	};
}