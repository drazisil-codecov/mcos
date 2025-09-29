import { BytableContainer } from "@rustymotors/binary";
import { LoginInfoMessage } from "./LoginInfoMessage.js";
import { align8 } from "./UserInfoMessage.js";
import { deserializeString, LegacyMessage } from "rusty-motors-shared";


export class UserInfoMessage extends LegacyMessage {
	_userId: number;
	_userName: string;
	_userData: Buffer;
	constructor() {
		super();
		this._userId = 0; // 4 bytes
		this._userName = ""; // 2 bytes + string
		this._userData = Buffer.alloc(64); // 64 bytes
	}

	/**
	 * @param {Buffer} buffer
	 * @returns {UserInfoMessage}
	 */
	override deserialize(buffer: Buffer): this {
		try {
			this._header.deserialize(buffer);
			let offset = this._header._size;
			this._userId = buffer.readUInt32BE(offset);
			offset += 4;
			this._userName = deserializeString(buffer.subarray(offset));
			offset += 4 + this._userName.length + 1;
			buffer.copy(this._userData, 0, offset, offset + 64);

			return this;
		} catch (error) {
			const err = Error(
				`Error deserializing UserInfoMessage: ${String(error)}`
			);
			err.cause = error;
			throw err;
		}
	}

	/**
	 * @returns {Buffer}
	 */
	override serialize(): Buffer {
		try {
			const leangth8 = align8(this._header.length);
			this._header.length = leangth8;
			const buffer = Buffer.alloc(leangth8);
			this._header.serialize().copy(buffer);
			let offset = this._header._size;
			buffer.writeUInt32BE(this._userId, offset);
			offset += 4;

			const username = new BytableContainer();
			username.setValue(this._userName);

			username.serialize().copy(buffer, offset);
			offset += username.serializeSize;
			this._userData.copy(buffer, offset);

			return buffer;
		} catch (error) {
			const err = Error(`Error serializing UserInfoMessage: ${String(error)}`);
			err.cause = error;
			throw err;
		}
	}

	/**
	 * @param {LoginInfoMessage} loginInfoMessage
	 */
	fromLoginInfoMessage(loginInfoMessage: LoginInfoMessage) {
		this._userId = loginInfoMessage._userId;
		this._userName = loginInfoMessage._userName;
		this._userData = loginInfoMessage._userData;
		this._header.length = this.calculateLength();
		return this;
	}

	calculateLength() {
		this._header.length = this._header._size + 4 + 2 + this._userName.length + 64;
		return this._header.length;
	}

	override toString() {
		return `UserInfoMessage: ${JSON.stringify({
			userId: this._userId,
			userName: this._userName,
			userData: this._userData.toString("hex"),
		})}`;
	}
}
