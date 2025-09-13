import { describe, it, expect } from "vitest";
import { TunablesMessage } from "./TunablesMessage.js";

describe("TunablesMessage", () => {
    it("should initialize with default values", () => {
        const msg = new TunablesMessage();
        expect(msg._msgNo).toBe(0);
        expect(msg._clubCreationCost).toBe(150);
        expect(msg._clubCreationRequiredLevel).toBe(1);
        expect(msg._clubOfficerRequiredLevel).toBe(1);
        expect(msg._inventorySizePerLevel).toBe(20);
        expect(msg._carsPerLevel).toBe(3);
        expect(msg._maxEZStreetLevel).toBe(5);
        expect(msg._clubSwitchCooldown).toBe(1);
        expect(msg._universalRepairCostModifier).toBe(3.6);
        expect(msg._universalScrapValueModifier).toBe(3.6);
        expect(msg._addCost1Day).toBe(1);
        expect(msg._addCost2Days).toBe(2);
        expect(msg._addCost3Days).toBe(3);
        expect(msg._addCost4Days).toBe(4);
        expect(msg._addCost5Days).toBe(5);
        expect(msg._addCost6Days).toBe(6);
        expect(msg._addCost7Days).toBe(7);
        expect(msg._tradeinModifier).toBe(3.6);
        expect(msg._simStreetMaxWager).toBe(20);
        expect(msg.saleryPerLevel).toBe(6);
        expect(msg._clubMaxMembers).toBe(4);
        expect(msg._clubRegistrationCost).toBe(2);
        expect(msg._clubReRegistrationCost).toBe(3);
        expect(msg._classifiedAdRate).toBe(10);
        expect(msg._classifiedAdMaxDuration).toBe(4);
        expect(msg._classifiedAdMaxSize).toBe(17);
        expect(msg._classifiedAdMaxCountPerPlayer).toBe(2);
    });

    it("should return correct size", () => {
        const msg = new TunablesMessage();
        expect(msg.size()).toBe(118);
    });

    it("should serialize to a buffer of correct length", () => {
        const msg = new TunablesMessage();
        const buf = msg.serialize();
        expect(Buffer.isBuffer(buf)).toBe(true);
        expect(buf.length).toBe(118);
    });

    it("should serialize values in correct order and format", () => {
        const msg = new TunablesMessage();
        const buf = msg.serialize();
        let offset = 0;
        expect(buf.readUInt16LE(offset)).toBe(msg._msgNo); offset += 2;
        expect(buf.readUInt32LE(offset)).toBe(msg._clubCreationCost); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._clubCreationRequiredLevel); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._clubOfficerRequiredLevel); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._inventorySizePerLevel); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._carsPerLevel); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._maxEZStreetLevel); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._clubSwitchCooldown); offset += 4;
        expect(buf.readDoubleLE(offset)).toBe(msg._universalRepairCostModifier); offset += 8;
        expect(buf.readDoubleLE(offset)).toBe(msg._universalScrapValueModifier); offset += 8;
        expect(buf.readUInt32LE(offset)).toBe(msg._addCost1Day); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._addCost2Days); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._addCost3Days); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._addCost4Days); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._addCost5Days); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._addCost6Days); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._addCost7Days); offset += 4;
        expect(buf.readDoubleLE(offset)).toBe(msg._tradeinModifier); offset += 8;
        expect(buf.readUInt32LE(offset)).toBe(msg._simStreetMaxWager); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg.saleryPerLevel); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._clubMaxMembers); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._clubRegistrationCost); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._clubReRegistrationCost); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._classifiedAdRate); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._classifiedAdMaxDuration); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._classifiedAdMaxSize); offset += 4;
        expect(buf.readUInt32LE(offset)).toBe(msg._classifiedAdMaxCountPerPlayer);
    });

    it("toString should include all property values", () => {
        const msg = new TunablesMessage();
        const str = msg.toString();
        expect(str).toContain(`msgNo=${msg._msgNo}`);
        expect(str).toContain(`clubCreationCost=${msg._clubCreationCost}`);
        expect(str).toContain(`clubCreationRequiredLevel=${msg._clubCreationRequiredLevel}`);
        expect(str).toContain(`clubOfficerRequiredLevel=${msg._clubOfficerRequiredLevel}`);
        expect(str).toContain(`inventorySizePerLevel=${msg._inventorySizePerLevel}`);
        expect(str).toContain(`carsPerLevel=${msg._carsPerLevel}`);
        expect(str).toContain(`maxEZStreetLevel=${msg._maxEZStreetLevel}`);
        expect(str).toContain(`clubSwitchCooldown=${msg._clubSwitchCooldown}`);
        expect(str).toContain(`universalRepairCostModifier=${msg._universalRepairCostModifier}`);
        expect(str).toContain(`universalScrapValueModifier=${msg._universalScrapValueModifier}`);
        expect(str).toContain(`addCost1Day=${msg._addCost1Day}`);
        expect(str).toContain(`addCost2Days=${msg._addCost2Days}`);
        expect(str).toContain(`addCost3Days=${msg._addCost3Days}`);
        expect(str).toContain(`addCost4Days=${msg._addCost4Days}`);
        expect(str).toContain(`addCost5Days=${msg._addCost5Days}`);
        expect(str).toContain(`addCost6Days=${msg._addCost6Days}`);
        expect(str).toContain(`addCost7Days=${msg._addCost7Days}`);
        expect(str).toContain(`tradeinModifier=${msg._tradeinModifier}`);
        expect(str).toContain(`simStreetMaxWager=${msg._simStreetMaxWager}`);
        expect(str).toContain(`saleryPerLevel=${msg.saleryPerLevel}`);
        expect(str).toContain(`clubMaxMembers=${msg._clubMaxMembers}`);
        expect(str).toContain(`clubRegistrationCost=${msg._clubRegistrationCost}`);
        expect(str).toContain(`clubReRegistrationCost=${msg._clubReRegistrationCost}`);
        expect(str).toContain(`classifiedAdRate=${msg._classifiedAdRate}`);
        expect(str).toContain(`classifiedAdMaxDuration=${msg._classifiedAdMaxDuration}`);
        expect(str).toContain(`classifiedAdMaxSize=${msg._classifiedAdMaxSize}`);
        expect(str).toContain(`classifiedAdMaxCountPerPlayer=${msg._classifiedAdMaxCountPerPlayer}`);
    });
});