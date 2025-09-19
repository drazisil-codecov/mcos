import { BytableStructure } from "@rustymotors/binary";


export class UserData_byte extends BytableStructure {
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

interface Serializable {
	serialize: () => Buffer,
	deserialize: (buf: Buffer) => void
	sizeOf: number
}

interface SerializableMessage {
	serialize: () => Buffer,
	deserialize: (buf: Buffer) => void
	sizeOf: number
	id: number
	length: number
}

/**
 * Aligns the given value to the nearest multiple of 4
 *
 * @param value - The number to be aligned.
 * @returns The aligned value, which is the smallest multiple of 8 that is greater than or equal to the input value.
 */
export function align4(value: number) {
	return value + (4 - (value % 4));
}

/**
 * Pads the input buffer with zero bytes so that its length becomes a multiple of 4.
 *
 * @param inBuf - The input buffer to pad.
 * @returns A new buffer with zero bytes appended to make its length a multiple of 4.
 */
function padBuffer(inBuf: Buffer): Buffer {
	const length = inBuf.byteLength

	return Buffer.concat([inBuf, Buffer.alloc((4 - (length % 4)))])
}

/**
 * Returns a subarray of the input buffer starting at the specified offset and of the specified length.
 * Throws an error if the input buffer does not contain enough bytes.
 *
 * @param inbuff - The input buffer to slice.
 * @param offset - The starting index from which to slice.
 * @param len - The number of bytes to include in the slice.
 * @returns A Buffer subarray containing the specified range.
 * @throws {Error} If the input buffer is not long enough to fulfill the request.
 */
function sliceBuff(inbuff: Buffer, offset: number, len: number): Buffer<ArrayBuffer> {
	const endIdx = offset + len
	if (inbuff.byteLength < endIdx) {
		throw new Error(`input buffer not log enough, need ${len} bytes`)
	}
	return Buffer.from(inbuff.subarray(offset, endIdx))
}

// ...existing code...
function real2Int(r: number): number {
	// C cast to int truncates toward zero; Math.trunc mirrors that behaviour
	return Math.trunc(r);
}

function real2Fixed(f: number): number {
	// REAL2FIXED(x) -> REAL2INT((x)*65536.0f)
	return real2Int(f * 65536.0);
}

export function int2Real(x: number): number { return x; }         // INT2REAL
export function fixed2Real(x: number): number { return x * (1.0 / 65536.0); } // FIXED2REAL
export function float2Real(x: number): number { return x; }       // FLOAT2REAL
export function real2Float(x: number): number { return x; }       // REAL2FLOAT
export function real(x: number): number { return x; }             // real()

// Angle / unit helpers
export const RMDEGREE2RAD = 0.01745328; // as in the original macro
export function rmDegree2Real(a: number): number { return a * (1.0 / 360.0); }  // RMDEGREE2REAL
export function rmReal2Rad(a: number): number { return a * (2.0 * 3.14159265359); } // RMREAL2RAD
export function rmReal2Degree(a: number): number { return a * 360.0; } // RMREAL2DEGREE

export function floatFrom5Dot3(b: number): number {
	// FLOATFROM5DOT3(b) -> FIXED2REAL(((int)b)<<13)
	// simplifies to b / 8
	return (b & 0xFF) / 8;
}

export function floatTo5Dot3(f: number): number {
	// FLOATTO5DOT3(f) -> ((REAL2FIXED(f)>>13)&0xFF)
	// REAL2FIXED(f) ~= Math.trunc(f * 65536) so this simplifies to Math.trunc(f * 8) & 0xFF
	return (Math.trunc(f * 8) & 0xFF);
}

/**
 * Sets or clears a single bit in a byte.
 *
 * @param byte - The original byte value (0-255).
 * @param bitIndex - The bit position to set or clear (0 for least significant bit, 7 for most significant).
 * @param value - If true, sets the bit; if false, clears the bit.
 * @returns The new byte value with the specified bit set or cleared.
 * @throws {Error} If byte or bitIndex is out of range.
 */
export function setBit(byte: number, bitIndex: number, value: boolean): number {
	checkSize1(byte)
	if (bitIndex < 0 || bitIndex > 7) {
		throw new Error('bitIndex must be in range 0-7');
	}
	return value
		? (byte | (1 << bitIndex))
		: (byte & ~(1 << bitIndex));
}

/**
 * Clears a single bit in a byte.
 *
 * @param byte - The original byte value (0-255).
 * @param bitIndex - The bit position to clear (0 for least significant bit, 7 for most significant).
 * @returns The new byte value with the specified bit cleared.
 * @throws {Error} If byte or bitIndex is out of range.
 */
export function clearBit(byte: number, bitIndex: number): number {
	checkSize1(byte)
	if (bitIndex < 0 || bitIndex > 7) {
		throw new Error('bitIndex must be in range 0-7');
	}
	return byte & ~(1 << bitIndex);
}

/**
 * Gets the value of a single bit in a byte.
 *
 * @param byte - The byte value (0-255).
 * @param bitIndex - The bit position to get (0 for least significant bit, 7 for most significant).
 * @returns True if the bit is set, false otherwise.
 * @throws {Error} If byte or bitIndex is out of range.
 */
export function getBit(byte: number, bitIndex: number): boolean {
	checkSize1(byte)
	if (bitIndex < 0 || bitIndex > 7) {
		throw new Error('bitIndex must be in range 0-7');
	}
	return ((byte >> bitIndex) & 1) === 1;
}

/**
 * Creates a Buffer containing a single byte representing the given value.
 *
 * @param val - The number to write into the buffer. Must be in the range 0x00 to 0xFF (0 to 255).
 * @returns A Buffer containing the single byte value.
 * @throws {Error} If `val` is outside the range of a single byte.
 */
function setByte(val: number): Buffer<ArrayBuffer> {
	const b = Buffer.alloc(1)

	checkSize1(val)
	b.writeUint8(val)
	return b
}

/**
 * Checks if a given number fits within 1 byte (0x00 to 0xFF).
 * Throws an error if the value is outside this range.
 *
 * @param val - The number to check.
 * @throws {Error} If the value does not fit in 1 byte.
 */
function checkSize1(val: number) {
	if (val < 0x00 || val > 0xFF) {
		throw new Error(`value must fit in 1 bytes. got: ${val.toString(16)}`);
	}
}


/**
 * Checks whether a given number fits within 2 bytes (unsigned 16-bit integer).
 * Throws an error if the value is less than 0x00 or greater than 0xFFFF.
 *
 * @param val - The number to check.
 * @throws {Error} If the value does not fit in 2 bytes.
 */
function checkSize2(val: number) {
	if (val < 0x00 || val > 0xFFFF) {
		throw new Error(`value must fit in 2 bytes. got: ${val.toString(16)}`);
	}
}

/**
 * Checks whether the given number fits within 4 bytes (unsigned 32-bit integer).
 * Throws an error if the value is less than 0x00 or greater than 0xFFFFFFFF.
 *
 * @param val - The number to check.
 * @throws {Error} If the value does not fit in 4 bytes.
 */
function checkSize4(val: number) {
	if (val < 0x00 || val > 0xFFFFFFFF) {
		throw new Error(`value must fit in 4 bytes. got: ${val.toString(16)}`);
	}
}

export class CarDecal implements Serializable {
	private _backgroundImage: Buffer; // byte
	private _forgroundImage: Buffer; // byte
	private _color0: Buffer; // byte
	private _color1: Buffer; // byte

	constructor() {
		this._backgroundImage = Buffer.alloc(1)
		this._forgroundImage = Buffer.alloc(1)
		this._color0 = Buffer.alloc(1)
		this._color1 = Buffer.alloc(1)
	}


	get compressed() {
		return Buffer.concat([this._backgroundImage, this._forgroundImage, this._color0, this._color1])
	}

	set compressed(val: Buffer) {
		if (val.byteLength !== 4) {
			throw new Error('compressed must be exactly 4 bytes')
		}

		this._backgroundImage = Buffer.from(val.subarray(0, 1))
		this._forgroundImage = Buffer.from(val.subarray(1, 2))
		this._color0 = Buffer.from(val.subarray(2, 3))
		this._color1 = Buffer.from(val.subarray(3, 4))
	}

	get sizeOf() {
		return 4
	}

	serialize() {
		return this.compressed
	};

	deserialize(buf: Buffer) {
		if (buf.byteLength !== 4) {
			throw new Error('input must be exactly 4 bytes long')
		}
		this.compressed = buf
	}

}

export class CarIds implements Serializable {
	private dbCarID; // ulong         // DB part instance (may be zero, if this is just a stock car def)
	private dbBptID;   // ulong       // branded part type ID (stock car definitions)
	private dbSkinID;      // ulong   // skin ID
	private _driverModelType; // byte
	private _driverSkinColor; // int // 32-bit argb
	private _driverHairColor; // int// 32-bit argb
	private _driverShirtColor; //int  // 32-bit argb
	private _driverPantsColor; // int  // 32-bit argb
	private _flags;    // char        // (for multicar) if not 0, force the car to reload, will get reset to 0 when the car starts reloading
	private _skinFlags; // char
	private _CarDecal: CarDecal;

	constructor() {
		this.dbCarID = Buffer.alloc(4)
		this.dbBptID = Buffer.alloc(4)
		this.dbSkinID = Buffer.alloc(4)
		this._driverModelType = Buffer.alloc(1)
		this._driverSkinColor = Buffer.alloc(4)
		this._driverHairColor = Buffer.alloc(4)
		this._driverShirtColor = Buffer.alloc(4)
		this._driverPantsColor = Buffer.alloc(4)
		this._flags = Buffer.alloc(1)
		this._skinFlags = Buffer.alloc(1)
		this._CarDecal = new CarDecal()

	}

	/**
	 * Sets the driver model type for the user.
	 * 
	 * @param val - The numeric value representing the driver model type.
	 *              This value is processed by the `setByte` function before assignment.
	 */
	set driverModelType(val: number) {
		this._driverModelType = setByte(val)
	}

	set skinFlags(val: number) {
		this._skinFlags = setByte(val)
	}

	set flags(val: number) {
		this._flags = setByte(val)
	}


	get sizeOf() {
		return 40
	}

	serialize() {
		return Buffer.concat([
			this.dbCarID,
			this.dbBptID,
			this.dbSkinID,
			padBuffer(this._driverModelType),
			this._driverSkinColor,
			this._driverHairColor,
			this._driverShirtColor,
			this._driverPantsColor,
			padBuffer(this._flags),
			padBuffer(this._skinFlags),
			this._CarDecal.serialize()
		])
	}

	deserialize(buf: Buffer) {
		let offset = 0
		this.dbCarID = sliceBuff(buf, offset, 4)
		offset += 4
		this.dbBptID = sliceBuff(buf, offset, 4)
		offset += 4
		this.dbSkinID = sliceBuff(buf, offset, 4)
		offset += 4
		this._driverModelType = sliceBuff(buf, offset, 1)
		offset += 4
		this._driverSkinColor = sliceBuff(buf, offset, 4)
		offset += 4
		this._driverHairColor = sliceBuff(buf, offset, 4)
		offset += 4
		this._driverShirtColor = sliceBuff(buf, offset, 4)
		offset += 4
		this._driverPantsColor = sliceBuff(buf, offset, 4)
		offset += 4
		this._flags = sliceBuff(buf, offset, 1)
		offset += 4
		this._skinFlags = sliceBuff(buf, offset, 1)
		offset += 4
		this._CarDecal.deserialize(sliceBuff(buf, offset, this._CarDecal.sizeOf))
	}
}

export class UserData implements Serializable {
	private _carIds: CarIds //", field: "Structure" },
	private _lobbyId: Buffer //", field: "Dword" },
	private _clubId: Buffer //", field: "Dword" },
	private _flags: Buffer // 1 byte bitfield
	private _performance: Buffer //", field: "Dword" },
	private _points: Buffer //", field: "Dword" },
	private _level: Buffer //", field: "Short" },

	constructor() {
		this._carIds = new CarIds
		this._lobbyId = Buffer.alloc(4)
		this._clubId = Buffer.alloc(4)
		this._flags = Buffer.alloc(1)
		this._performance = Buffer.alloc(4)
		this._points = Buffer.alloc(4)
		this._level = Buffer.alloc(2)
	}

	get sizeOf() {
		return 64
	}

	serialize() {
		return padBuffer(Buffer.concat([
			this._carIds.serialize(),
			this._lobbyId,
			this._clubId,
			this._flags,
			this._performance,
			this._points,
			this._level,
		]))
	}

	deserialize(buf: Buffer) {
		if (buf.byteLength < 64) {
			throw new Error(`Buffer must be 54 bytes: ${buf.byteLength}`)
		}
		let offset = 0
		this._carIds.deserialize(buf.subarray(offset))
		offset += align4(this._carIds.sizeOf)
		this._lobbyId = sliceBuff(buf, offset, 4)
		offset += 4
		this._clubId = sliceBuff(buf, offset, 4)
		offset += 4
		this._flags = sliceBuff(buf, offset, 1)
		offset += 1
		this._performance = sliceBuff(buf, offset, 4)
		offset += 4
		this._points = sliceBuff(buf, offset, 4)
		offset += 4
		this._level = sliceBuff(buf, offset, 2)
	}
}

class RawMessageHeader implements SerializableMessage {
	private _id: Buffer
	private _length: Buffer

	constructor() {
		this._id = Buffer.alloc(2)
		this._length = Buffer.alloc(2)
	}

	get sizeOf() {
		return 4
	}

	serialize() {
		return Buffer.from(Buffer.concat([
			this._id,
			this._length
		]))
	}

	deserialize(buf: Buffer) {
		if (buf.byteLength < 4) {
			throw new Error('Header must be 4 bytes long')
		}
		this._id = sliceBuff(buf, 0, 2)
		this._length = sliceBuff(buf, 2, 2)
	}

	get id() {
		return this._id.readInt16BE()
	}

	set id(val: number) {
		checkSize2(val);
		this._id.writeInt16BE(val)
	}

	get length() {
		return this._length.readInt16BE()
	}

	set length(val: number) {
		checkSize2(val)
		this._length.writeInt16BE(val)
	}
}

export class RawMessage implements SerializableMessage {
	private _header: RawMessageHeader
	private _data: Buffer

	constructor() {
		this._header = new RawMessageHeader()
		this._data = Buffer.alloc(0)
	}

	get sizeOf() {
		return this._header.length ?? 4 + this._data.byteLength
	}

	serialize() {
		return Buffer.from(Buffer.concat([
			this._header.serialize(),
			this._data
		]))
	}

	deserialize(buf: Buffer) {
		checkSize4(buf.byteLength)
		this._header.deserialize(sliceBuff(buf, 0, 4))
		if (buf.byteLength > 4) {
			this._data = Buffer.from(buf.subarray(4))
		}
	}

	get id() {
		return this._header.id
	}

	set id(val: number) {
		checkSize2(val)
		this._header.id = val
	}

	get length() {
		return this._header.length
	}

	set length(val: number) {
		checkSize2(val)
		this._header.length = val
	}
}

class CString implements Serializable {
	private _string: Buffer
	private _maxLen: number

	constructor(maxLen: number) {
		this._maxLen = maxLen
		this._string = Buffer.alloc(0)
	}

	get sizeOf() {
		return 4 + this._string.byteLength
	}

	serialize() {
		const len = this._string.byteLength
		const lenBuf = Buffer.alloc(4)
		lenBuf.writeInt32BE(len)
		return Buffer.from(Buffer.concat([
			lenBuf,
			this._string
		]))
	}

	deserialize(buf: Buffer) {
		if (buf.byteLength < 4) {
			throw new Error(`need at least 4 bytes for length. got ${buf.byteLength}`)
		}
		const strLength = buf.readInt32BE() + 4
		this._string = Buffer.from(buf.subarray(4, strLength))

	}

	toString() {
		return this._string.toString("utf8")
	}

	get length() {
		return this._string.byteLength
	}
}

export class UserInfo implements Serializable {
	private _userId: Buffer
	private _username: CString
	private _userData: UserData

	constructor() {
		this._userId = Buffer.alloc(4)
		this._username = new CString(32)
		this._userData = new UserData()
	}

	get sizeOf() {
		return 4 + this._username.sizeOf + this._userData.sizeOf
	}

	serialize() {
		return Buffer.from(Buffer.concat([
			this._userId,
			this._username.serialize(),
			this._userData.serialize()
		]))
	}

	deserialize(buf: Buffer) {
		const minSize = 4 + 2 + this._userData.sizeOf
		if (buf.byteLength < minSize) {
			throw new Error(`buffer too small. need ${minSize} bytes, got ${buf.byteLength} bytes`)
		}
		let offset = 0
		this._userId = sliceBuff(buf, offset, 4)
		offset += 4
		this._username.deserialize(buf.subarray(offset))
		offset += this._username.sizeOf
		this._userData.deserialize(buf.subarray(offset))
	}
}

export class SetMyUserDataMessage implements SerializableMessage {
	private _header: RawMessageHeader
	private _userInfo: UserInfo

	constructor() {
		this._header = new RawMessageHeader()
		this._userInfo = new UserInfo()
	}

	get sizeOf() {
		return this._header.sizeOf + this._userInfo.sizeOf
	}

	serialize() {
		return Buffer.from(Buffer.concat([
			this._header.serialize(),
			this._userInfo.serialize()
		]))
	}

	deserialize(buf: Buffer) {
		if (buf.byteLength < this._header.sizeOf) {
			throw new Error(`unable to deserialize header, need 4 bytes, got ${buf.byteLength} bytes`)
		}
		let offset = 0
		this._header.deserialize(sliceBuff(buf, offset, 4))
		offset += 4
		this._userInfo.deserialize(buf.subarray(offset))
		// Update header length to match actual message size
		this._header.length = buf.byteLength;
	}

	get id() {
		return this._header.id
	}

	get length() {
		return this._header.length
	}
}


