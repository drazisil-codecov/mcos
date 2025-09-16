import { BytableStructure } from "@rustymotors/binary";


export class UserData extends BytableStructure {
	// 00000000000000000000000005000000a5ceffff0d45acffffffffff00d8ffff0000000000000000010000000000000008000000000000000001000000000000
	constructor() {
		super();
		this.setSerializeOrder([
			{ name: "carIds", field: "Structure" },
			{ name: "lobbyId", field: "Dword" },
			{ name: "clubId", field: "Dword" },
			{ name: "inLobby", field: "Boolean" },
			{ name: "inMovement", field: "Boolean" },
			{ name: "inRace", field: "Boolean" },
			{ name: "isDataValid", field: "Boolean" },
			{ name: "unused", field: "Boolean" },
			{ name: "performance", field: "Dword" },
			{ name: "points", field: "Dword" },
			{ name: "level", field: "Short" },
		]);
	}
}
