import { EventEmitter } from 'node:events';

export default function (Base) {
    return class stmuxEmitter extends Base {
        establishEmitter () {
            const emitter = new EventEmitter();
            this.emit = (...args) => emitter.emit(...args);
            this.on = (...args) => emitter.on(...args);
            this.off = (...args) => emitter.off(...args);
            this.removeListener = (...args) => emitter.removeListener(...args);
            this.removeAllListener = (...args) => emitter.removeAllListener(...args);
            this.setMaxListeners = (...args) => emitter.setMaxListeners(...args);
            this.getMaxListeners = (...args) => emitter.getMaxListeners(...args);
        }
    };
}
