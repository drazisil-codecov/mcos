import { getServerLogger, messageQueueItem } from "rusty-motors-shared";

export class MessageQueue {
    private _name: string;
    private _queue: messageQueueItem[];
    private _processItemCb: (item: messageQueueItem) => Promise<void>;
    private _tickInterval: number;
    private _isRunning = false;
    private _counter: number;
    private _log;

    constructor(name: string, interval: number, callback: (messageQueueItem: messageQueueItem) => Promise<void>, log = getServerLogger(`queue: ${name}`)) {
        this._name = name;
        this._queue = [];
        this._log = log;
        this._processItemCb = callback;
        this._tickInterval = interval;
        this._counter = 1;
        this._isRunning = true;
        this._run();
    }

    private async _run() {
        while (this._isRunning) {
            if (!this._queue.length) {
                await new Promise(resolve => setTimeout(resolve, this._tickInterval));
                continue;
            }; // No work, skipping
            const item: messageQueueItem | undefined = this._queue.shift();
            if (typeof item !== "undefined") {
                this._log.warn(`${this._name} message queue doing work ${item.id}`);
                await this._processItemCb(item);
            }
        }
        this._log.warn(`${this._name} message queue exiting`);
    }

    put(item: messageQueueItem): void {
        item.id = this._counter++;
        this._queue.push(item);
    }

    exit() {
        this._isRunning = false;
    }
}
