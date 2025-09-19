import { deserializeString, getServerLogger } from "rusty-motors-shared";
import { serializeString } from "rusty-motors-shared";
// eslint-disable-next-line no-unused-vars
import { BytableStructure } from "@rustymotors/binary";
import { UserData_byte } from "./UserData.js";

export class MiniUserInfo extends BytableStructure {
	constructor() {
		super();
		this.setSerializeOrder([
			{ name: "userId", field: "Dword" },
			{ name: "userName", field: "String" },
		]);
	}
}


export class UserInfo {
	_userId: number;
	_userName: string;
	_userData: UserData_byte;
	constructor() {
		this._userId = 0; // 4 bytes
		this._userName = ""; // 2 bytes + string
		this._userData = new UserData_byte()
	}

	deserialize(buffer: Buffer) {
		let offset = 0;
		this._userId = buffer.readUInt32BE(offset);
		offset += 4;
		this._userName = deserializeString(buffer.subarray(offset));
		offset += 4 + this._userName.length;
		this._userData.deserialize(buffer.subarray(offset, offset + 64));
		return this;
	}

	serialize() {
		const buffer = Buffer.alloc(this.size());
		let offset = 0;
		buffer.writeUInt32BE(this._userId, offset);
		offset += 4;
		offset = serializeString(this._userName, buffer, offset);

		this._userData.serialize().copy(buffer, offset);
		return buffer;
	}

	size() {
		let size = 4; // userId
		size += 4 + this._userName.length + 1;
		size += this._userData.serializeSize;
		return size;
	}
}

export function align8(value: number) {
	return value + (8 - (value % 8));
}

