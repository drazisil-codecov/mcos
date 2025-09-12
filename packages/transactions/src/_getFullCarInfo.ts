import { buildVehiclePartTreeFromDB, type TPart, getVehiclePartTree, vehiclePartTreeToJSON } from "rusty-motors-database";
import { getServerLogger, OldServerMessage } from "rusty-motors-shared";
import { MessageHandlerArgs, MessageHandlerResult } from "./handlers.js";
import { GenericRequestMessage } from "./GenericRequestMessage.js";

const DAMAGE_SIZE = 2000;

export class VehicleStruct {
    VehicleID: number = 0; // 4 bytes
    SkinID: number = 0; // 4 bytes
    Flags: number = 0; // 4 bytes
    Delta: number = 0; // 4 bytes
    CarClass: number = 0; // 1 byte
    Damage: Buffer = Buffer.alloc(DAMAGE_SIZE); // buffer, max DAMAGE_SIZE
    damageLengthOverride: number | null = null;

    serialize() {
        try {
            const buffer = Buffer.alloc(this.size());
            buffer.writeInt32LE(this.VehicleID, 0); // offset 0
            buffer.writeInt32LE(this.SkinID, 4); // offset 4
            buffer.writeInt32LE(this.Flags, 8); // offset 8
            buffer.writeInt32LE(this.Delta, 12); // offset 12
            buffer.writeInt8(this.CarClass, 16); // offset 16
            const damageLengthOverride = this.damageLengthOverride ?? this.Damage.length;
            buffer.writeInt16LE(damageLengthOverride, 17); // offset 17
            if (this.Damage.length > 0) {
                this.Damage.copy(buffer, 19); // offset 19
            }
            return buffer;
        } catch (error) {
            getServerLogger("transactions/VehicleStruct").error(
                `Error in VehicleStruct.serialize: ${error}`,
            );
            throw error;
        }
    }

    size() {
        return 19 + this.Damage.length;
    }

    toString() {
        return `
        VehicleID: ${this.VehicleID} 
        SkinID: ${this.SkinID} 
        Flags: ${this.Flags} 
        Delta: ${this.Delta} 
        CarClass: ${this.CarClass}
        Damage: ${this.Damage.toString("hex")}
        `;
    }
}

export class PartStruct {
    partId: number = 0; // 4 bytes
    parentPartId: number | null = 0; // 4 bytes
    brandedPartId: number = 0; // 4 bytes
    repairCost: number = 0; // 4 bytes
    junkyardValue: number = 0; // 4 bytes
    wear: number = 0; // 4 bytes
    attachmentPoint: number = 0; // 1 byte
    damage: number = 0; // 1 byte

    serialize() {
        const log = getServerLogger("transactions/PartStruct");
        try {
            const buffer = Buffer.alloc(this.size());
            log.debug(`Writing partId: ${this.partId}`);
            buffer.writeUInt32LE(this.partId, 0);
            log.debug(`Writing parentPartId: ${this.parentPartId}`);
            buffer.writeInt32LE(this.parentPartId ?? 0, 4);
            log.debug(`Writing brandedPartId: ${this.brandedPartId}`);
            buffer.writeInt32LE(this.brandedPartId, 8);
            log.debug(`Writing repairCost: ${this.repairCost}`);
            buffer.writeInt32LE(this.repairCost, 12);
            log.debug(`Writing junkyardValue: ${this.junkyardValue}`);
            buffer.writeInt32LE(this.junkyardValue, 16);
            log.debug(`Writing wear: ${this.wear}`);
            buffer.writeInt32LE(this.wear, 20);
            log.debug(`Writing attachmentPoint: ${this.attachmentPoint}`);
            buffer.writeInt8(this.attachmentPoint, 24);
            log.debug(`Writing damage: ${this.damage}`);
            buffer.writeInt8(this.damage, 25);
            return buffer;
        } catch (error) {
            log.error(`Error in PartStruct.serialize: ${error}`);
            throw error;
        }
    }

    size() {
        return 26;
    }

    toString() {
        return `partId: ${this.partId} parentPartId: ${this.parentPartId} brandedPartId: ${this.brandedPartId} repairCost: ${this.repairCost} junkyardValue: ${this.junkyardValue} wear: ${this.wear} attachmentPoint: ${this.attachmentPoint} damage: ${this.damage}`;
    }
}

class CarInfoStruct {
    msgNo: number = 0; // 2 bytes
    playerId: number = 0; // 4 bytes
    vehicle: VehicleStruct = new VehicleStruct();
    noOfParts: number = 0; // 2 bytes
    parts: PartStruct[] = [];

    serialize() {
        const log = getServerLogger("transactions/CarInfoStruct");
        try {
            const neededSize = 10 + this.vehicle.size() + this.noOfParts * 26;

            log.debug(`Needed size: ${neededSize}`);

            const buffer = Buffer.alloc(neededSize);
            log.debug(`Writing msgNo: ${this.msgNo}`);
            buffer.writeUInt16LE(this.msgNo, 0);
            log.debug(`Writing playerId: ${this.playerId}`);
            buffer.writeUInt32LE(this.playerId, 2);
            log.debug(`Serializing vehicle`);
            this.vehicle.serialize().copy(buffer, 6);
            log.debug(`Writing noOfParts: ${this.noOfParts}`);
            buffer.writeUInt16LE(this.noOfParts, 6 + this.vehicle.size());
            let offset = 8 + this.vehicle.size();
            for (const part of this.parts) {
                log.debug(`Serializing part: ${part}`);
                part.serialize().copy(buffer, offset);
                offset += part.size();
            }
            return buffer;
        } catch (error) {
            log.error(`Error in CarInfoStruct.serialize: ${error}`);
            throw error;
        }
    }

    size() {
        return 10 + this.vehicle.size() + this.noOfParts * 26;
    }

    toString() {
        return `msgNo: ${this.msgNo} playerId: ${this.playerId} vehicle: ${this.vehicle} noOfParts: ${this.noOfParts} parts: ${this.parts}`;
    }
}

export type DBPart = {
    partId: number;
    parentPartId: number | null;
    brandedPartId: number;
    percentDamage: number;
    itemWear: number;
    attachmentPointId: number;
    ownerId: number;
    partName: string;
    repairCost: number;
    scrapValue: number;
};

/**
 * @param {MessageHandlerArgs} args
 * @return {Promise<MessageHandlerResult>}
 */
export async function _getCompleteVehicleInfo({
    connectionId,
    packet,
    log = getServerLogger("transactions/getCompleteVehicleInfo"),
}: MessageHandlerArgs): Promise<MessageHandlerResult> {
    const getCompleteVehicleInfoMessage = new GenericRequestMessage();
    getCompleteVehicleInfoMessage.deserialize(packet.data);

    log.debug(`Received Message: ${getCompleteVehicleInfoMessage.toString()}`);

    const vehicleId = getCompleteVehicleInfoMessage.data.readUInt32LE();
    const delta = getCompleteVehicleInfoMessage.data2.readUInt32LE();

    log.debug(`Requesting vehicleId: ${vehicleId} delta: ${delta}`);

    try {
        const carInfo = new CarInfoStruct();

        let vehicleFromCache = await getVehiclePartTree(vehicleId);

        if (typeof vehicleFromCache === "undefined") {
            log.debug(
                `Vehicle with id ${vehicleId} not found in cache, fetching from DB`,
            );
            vehicleFromCache = await buildVehiclePartTreeFromDB(vehicleId);
        }

        if (typeof vehicleFromCache === "undefined") {
            throw new Error(
                `Vehicle with id ${vehicleId} not found and not in DB`,
            );
        }

        log.debug(
            `Vehicle part tree successfully fetched: ${vehiclePartTreeToJSON(
                vehicleFromCache,
            )}`,
        );

        carInfo.msgNo = 123;
        carInfo.playerId = 1;

        const vehicleStruct = new VehicleStruct();
        vehicleStruct.VehicleID = vehicleId;
        vehicleStruct.SkinID = vehicleFromCache.skinId;
        vehicleStruct.Flags = vehicleFromCache.flags;
        vehicleStruct.Delta = 0;
        vehicleStruct.CarClass = vehicleFromCache.class;
        const damageInfo =
            vehicleFromCache.damageInfo ?? Buffer.alloc(DAMAGE_SIZE);
        vehicleStruct.Damage = damageInfo;
        vehicleStruct.damageLengthOverride = 0;

        log.debug(`VehicleStruct: ${vehicleStruct}`);

        carInfo.vehicle = vehicleStruct;

        const parts: PartStruct[] = [];

        const tmpParts: TPart[] = vehicleFromCache.partTree.level1.parts.concat(
            vehicleFromCache.partTree.level2.parts,
        );

        carInfo.noOfParts = tmpParts.length;

        for (const part of tmpParts) {
            const partStruct = new PartStruct();
            partStruct.partId = part.part_id;
            partStruct.parentPartId = part.parent_part_id;
            partStruct.brandedPartId = part.branded_part_id;
            partStruct.repairCost = part.repair_cost;
            partStruct.junkyardValue = part.scrap_value;
            partStruct.wear = part.item_wear;
            partStruct.attachmentPoint = part.attachment_point_id ?? 0;
            partStruct.damage = part.percent_damage;

            log.debug(`PartStruct: ${partStruct}`);

            parts.push(partStruct);
        }

        carInfo.parts = parts;

        const responsePacket = new OldServerMessage();
        responsePacket._header.sequence = packet.sequenceNumber;
        responsePacket._header.flags = 8;
        responsePacket.setBuffer(carInfo.serialize());

        return { connectionId, messages: [responsePacket] };
    } catch (error) {
        log.error(`Error in Fetching car: ${error}`);
        throw error;
    }
}