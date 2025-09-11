// mcos is a game server, written from scratch, for an old game
// Copyright (C) <2017>  <Drazi Crendraven>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { BytableBase } from './BytableBase.js';
import { BytableObject } from './types.js';

abstract class BytableContainerBase extends BytableBase implements BytableObject {
    protected value_: string | number | Buffer = '';
    protected nullTerminated = false;
    protected length = 0;
    protected name_ = '';

    abstract get json(): Record<string, unknown>;
    abstract override get serializeSize(): number;
    abstract override serialize(): Buffer;
    abstract override deserialize(buffer: Buffer): void;

    setValue(value: string | number | Buffer): void {
        this.validateValue(value);
        if (this.nullTerminated && typeof value === 'string') {
            this.validateString(value);
        }
        this.value_ = value;
        this.length = this.getByteLength(value);
    }

    getValue(): string | number | Buffer {
        return this.value_;
    }

    setNullTerminated(nullTerminated: boolean): void {
        this.nullTerminated = nullTerminated;
    }

    getNullTerminated(): boolean {
        return this.nullTerminated;
    }

    /**
     * Set the length of the container.
     * @param length - The length of the container.
     * @returns void
     * @throws Error if the container is set to null terminated
     */
    setLength(length: number): void {
        if (this.nullTerminated) {
            throw new Error('Cannot set length for null terminated container');
        } else {
            this.length = length;
        }
    }

    getLength(): number {
        return this.length;
    }

    setName(name: string): void {
        this.name_ = name;
    }

    get name(): string {
        return this.name_;
    }

    get value(): string | number | Buffer {
        return this.value_;
    }

    override toString(): string {
        throw new Error('Method not implemented.');
    }
}

export class BytableShortContainer extends BytableContainerBase {
    override get serializeSize() {
        return this.nullTerminated ? this.length + 1 : this.length + 2;
    }

    /**
     * Serialize the container.
     * @returns Buffer - The serialized container.
     */
    override serialize() {
        const value = this.toBuffer(this.value_);
        if (this.nullTerminated) {
            return value.length === 0
                ? Buffer.from('\0')
                : Buffer.concat([value, Buffer.from('\0')]);
        } else {
            const lengthPrefix = Buffer.alloc(2);
            lengthPrefix.writeUInt16BE(this.length, 0);
            return Buffer.concat([lengthPrefix, value]);
        }
    }

    /**
     * Deserialize the container.
     * @param buffer - The buffer to deserialize.
     * @returns void
     */
    override deserialize(buffer: Buffer) {
        const offset = 0;
        if (this.nullTerminated) {
            // Find the first null byte (0x00)
            const nullIdx = buffer.indexOf(0, offset);
            if (nullIdx === -1) {
                throw new Error('Null terminator not found in buffer');
            }
            const str = buffer.subarray(offset, nullIdx).toString('utf-8');
            this.setValue(str);
            this.length = Buffer.from(str).length;
        } else {
            const length = buffer.readUInt16BE(offset);
            this.setValue(
                buffer
                    .subarray(offset + 2, offset + length + 2)
                    .toString('utf-8'),
            );
            this.length = length;
        }
    }

    get json() {
        return {
            name: this.name_,
            value: this.value_,
            length: this.length,
            nullTerminated: this.nullTerminated,
            serializeSize: this.serializeSize,
        };
    }
}

export class BytableContainer extends BytableContainerBase {
    override get serializeSize() {
        return this.nullTerminated ? this.length + 1 : this.length + 4;
    }

    /**
     * Serialize the container.
     * @returns Buffer - The serialized container.
     */
    override serialize() {
        const value = this.toBuffer(this.value_);
        if (this.nullTerminated) {
            return value.length === 0
                ? Buffer.from('\0')
                : Buffer.concat([value, Buffer.from('\0')]);
        } else {
            const lengthPrefix = Buffer.alloc(4);
            lengthPrefix.writeUInt32BE(this.length, 0);
            return Buffer.concat([lengthPrefix, value]);
        }
    }

    /**
     * Deserialize the container.
     * @param buffer - The buffer to deserialize.
     * @returns void
     */
    override deserialize(buffer: Buffer) {
        const offset = 0;
        if (this.nullTerminated) {
            // Find the first null byte (0x00)
            const nullIdx = buffer.indexOf(0, offset);
            if (nullIdx === -1) {
                throw new Error('Null terminator not found in buffer');
            }
            const str = buffer.subarray(offset, nullIdx).toString('utf-8');
            this.setValue(str);
            this.length = Buffer.from(str).length;
        } else {
            const length = buffer.readUInt32BE(offset);
            this.setValue(
                buffer
                    .subarray(offset + 4, offset + length + 4)
                    .toString('utf-8'),
            );
            this.length = length;
        }
    }

    get json() {
        return {
            value: this.value_,
            length: this.length,
            nullTerminated: this.nullTerminated,
            serializeSize: this.serializeSize,
        };
    }
}