import { BytableMessage } from "@rustymotors/binary";
import { SerializedBufferOld, ServerLogger } from "rusty-motors-shared";

export async function handleTrackingPing({
	connectionId,
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