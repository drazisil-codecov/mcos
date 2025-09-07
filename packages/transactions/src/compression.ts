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

type read_buf_func = (buf: Buffer, size: number, param: any) => number // uint

type write_buf_func = (buf: Buffer, size: number, param: any) => void

enum LUTSizesEnum {
    DIST_SIZES=0x40,
    CH_BITS_ASC_SIZE=0x100,
    LENS_SIZES=0x10,
};

enum CommonSizes {
    OUT_BUFF_SIZE = 0x802,
    BUFF_SIZE=0x2204,
};

enum ExplodeSizesEnum {
    IN_BUFF_SIZE=0x800,
    CODES_SIZE=0x100,
    OFFSS_SIZE=0x100,
    OFFSS_SIZE1=0x80,
};

enum {
    EXP_BUFFER_SIZE = sizeof(TDcmpStruct), // Size of decompression structure
                                           // Defined as 12596 in pkware headers
};

class TDcmpStruct {
    private offs0000 // ulong  0000
    private ctype // ulong 0004: Compression type (CMP_BINARY or CMP_ASCII)
    private outputPos // ulong 0008: Position in output buffer
    private dsize_bits // ulong 000C: Dict size (4, 5, 6 for 0x400, 0x800, 0x1000)
    private dsize_mask // ulong 0010: Dict size bitmask (0x0F, 0x1F, 0x3F for 0x400, 0x800, 0x1000)
    private bit_buff // ulong 0014: 16-bit buffer for processing input data
    private extra_bits // ulong 0018: Number of extra (above 8) bits in bit buffer
    private extra_bits // uint 001C: Position in in_buff
    private in_bytes // ulong 0020: Number of bytes in input buffer
    private param // void* 0024: Custom parameter
    private read_buf: read_buf_func // read_buf_func // Pointer to function that reads data from the input stream
    private write_buf: write_buf_func // write_buf_func // Pointer to function that writes data to the output stream
    private out_buff // uchar[BUFF_SIZE] 0030: Output circle buffer.
                                            //       0x0000 - 0x0FFF: Previous uncompressed data, kept for repetitions
                                            //       0x1000 - 0x1FFF: Currently decompressed data
                                            //       0x2000 - 0x2203: Reserve space for the longest possible repetition
    private in_buff // uchar[IN_BUFF_SIZE] 2234: Buffer for data to be decompressed
    private DistPosCodes // uchar[CODES_SIZE] 2A34: Table of distance position codes
    private LengthCodes // uchar[CODES_SIZE] 2B34: Table of length codes
    private offs2C34 // uchar[OFFSS_SIZE] 2C34: Buffer for
    private offs2D34 // uchar[OFFSS_SIZE] 2D34: Buffer for
    private offs2E34 // uchar[OFFSS_SIZE1] 2E34: Buffer for
    private offs2EB4 // uchar[OFFSS_SIZE] 2EB4: Buffer fo
    private ChBitsAsc // uchar[CH_BITS_ASC_SIZE] 2FB4: Buffer for
    private DistBits // uchar[DIST_SIZES] 30B4: Numbers of bytes to skip copied block length
    private LenBits // uchar[LENS_SIZES] 30F4: Numbers of bits for skip copied block length
    private ExLenBits // uchar[LENS_SIZES] 3104: Number of valid bits for copied block
    private LenBase // ushort[LENS_SIZES] 3114: Buffer fo

}

export function explode(read_buf: read_buf_func, write_buf: write_buf_func, work_buf: Buffer, param: any) {}

export function implode() {}
