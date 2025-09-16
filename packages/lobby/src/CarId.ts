import { Bytable } from "@rustymotors/binary";
import { CarDecal } from "./CarDecal.js";


export class CarId extends Bytable {
	// 00000000000000000000000005000000a5ceffff0d45acffffffffff00d8ffff0000000000000000
	private carId_: Buffer = Buffer.alloc(4);
	private brandedPartId_: Buffer = Buffer.alloc(4);
	private skinId_: Buffer = Buffer.alloc(4);
	private driverModelType_: Buffer = Buffer.alloc(1);
	private driverSkinColor_: Buffer = Buffer.alloc(4);
	private driverHairColor_: Buffer = Buffer.alloc(4);
	private driverShirtColor_: Buffer = Buffer.alloc(4);
	private driverPantsColor_: Buffer = Buffer.alloc(4);
	private flags_: Buffer = Buffer.alloc(1);
	private skinFlags_: Buffer = Buffer.alloc(1);
	private decal_ = new CarDecal();

	override get serializeSize(): number {
		return 40;
	}

	override serialize(): Buffer {
		const buffer = Buffer.alloc(this.serializeSize);
		let offset = 0;
		this.carId_.copy(buffer, offset);
		offset += 4;
		this.brandedPartId_.copy(buffer, offset);
		offset += 4;
		this.skinId_.copy(buffer, offset);
		offset += 4;
		this.driverModelType_.copy(buffer, offset);
		offset += 1;
		this.driverSkinColor_.copy(buffer, offset);
		offset += 4;
		this.driverHairColor_.copy(buffer, offset);
		offset += 4;
		this.driverShirtColor_.copy(buffer, offset);
		offset += 4;
		this.driverPantsColor_.copy(buffer, offset);
		offset += 4;
		this.flags_.copy(buffer, offset);
		offset += 1;
		this.skinFlags_.copy(buffer, offset);
		offset += 1;
		this.decal_.serialize().copy(buffer, offset);
		return buffer;
	}

	override deserialize(buffer: Buffer): void {
		let offset = 0;
		this.carId_ = buffer.subarray(offset, offset + 4);
		offset += 4;
		this.brandedPartId_ = buffer.subarray(offset, offset + 4);
		offset += 4;
		this.skinId_ = buffer.subarray(offset, offset + 4);
		offset += 4;
		this.driverModelType_ = buffer.subarray(offset, offset + 1);
		offset += 1;
		this.driverSkinColor_ = buffer.subarray(offset, offset + 4);
		offset += 4;
		this.driverHairColor_ = buffer.subarray(offset, offset + 4);
		offset += 4;
		this.driverShirtColor_ = buffer.subarray(offset, offset + 4);
		offset += 4;
		this.driverPantsColor_ = buffer.subarray(offset, offset + 4);
		offset += 4;
		this.flags_ = buffer.subarray(offset, offset + 1);
		offset += 1;
		this.skinFlags_ = buffer.subarray(offset, offset + 1);
		offset += 1;
		this.decal_.deserialize(buffer.subarray(offset));
	}

	override toString(): string {
		return `Car ID: ${this.carId_.readUInt32LE(0)}, Branded Part ID: ${this.brandedPartId_.readUInt32LE(0)}, Skin ID: ${this.skinId_.readUInt32LE(0)}, Driver Model Type: ${this.driverModelType_.readUInt8(0)}, Driver Skin Color: ${this.driverSkinColor_.readUInt32LE(0)}, Driver Hair Color: ${this.driverHairColor_.readUInt32LE(0)}, Driver Shirt Color: ${this.driverShirtColor_.readUInt32LE(0)}, Driver Pants Color: ${this.driverPantsColor_.readUInt32LE(0)}, Flags: ${this.flags_.readUInt8(0)}, Skin Flags: ${this.skinFlags_.readUInt8(0)}, Decal: ${this.decal_.toString()}`;
	}

	toJSON(): any {
		return {
			carId: this.carId_.readUInt32LE(0),
			brandedPartId: this.brandedPartId_.readUInt32LE(0),
			skinId: this.skinId_.readUInt32LE(0),
			driverModelType: this.driverModelType_.readUInt8(0),
			driverSkinColor: this.driverSkinColor_.readUInt32LE(0),
			driverHairColor: this.driverHairColor_.readUInt32LE(0),
			driverShirtColor: this.driverShirtColor_.readUInt32LE(0),
			driverPantsColor: this.driverPantsColor_.readUInt32LE(0),
			flags: this.flags_.readUInt8(0),
			skinFlags: this.skinFlags_.readUInt8(0),
			decal: this.decal_.toJSON(),
		};
	}
}
