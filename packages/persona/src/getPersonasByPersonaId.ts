import { getServerLogger } from "rusty-motors-shared";
import { personaRecords } from "./internal.js";
import type { PersonaRecord } from "./PersonaMapsMessage.js";

const log = getServerLogger('getPersonaByPersonaId')

export async function getPersonaByPersonaId({
	personaId
}: {
	personaId: number;
}): Promise<Pick<
	PersonaRecord,
	"customerId" | "personaId" | "personaName" | "shardId"
> | undefined> {
	const result = personaRecords.find((persona) => {
		const match = personaId === persona.personaId;
		return match;
	});
	if (typeof result === "undefined") {
		log.warn(`Unable to locate a persona for id: ${personaId}`);
		return result
	}

	return result;
}
