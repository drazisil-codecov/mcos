import { PrimaryRoomServer } from "./lib/PrimaryRoomServer.js"
export * from "./types.js"

const primaryRoomServer = new PrimaryRoomServer()

export function getPrimaryRoomServer() {
    return primaryRoomServer
}