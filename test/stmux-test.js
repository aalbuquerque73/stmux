import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as td from 'testdouble';
import sinon from 'sinon';
import { EventEmitter } from 'events';
import stream from 'stream';
import child_process from 'child_process';

chai.use(chaiAsPromised);

describe('STMUX', function() {
    let blessed;
    let blessedXTerm;
    let stmux;

    beforeEach(async () => {
        blessed = await td.replaceEsm('blessed/lib/program.js');
        blessedXTerm = await td.replaceEsm('blessed-xterm');
        stmux = await import('../src/stmux.js');
    });
    this.afterEach(() => {
        td.reset();
    });

    it('Should work', async function() {
        const sandbox = sinon.createSandbox();
        try {
            const proc = new EventEmitter();
            proc.stdin = new stream.Writable();
            proc.stdout = new EventEmitter();
            proc.stderr = new EventEmitter();
            sandbox.stub(child_process, 'spawn').returns(proc);
            // td.when()
            const mux = new stmux.STMUX();
            mux.main(['node', 'stmux', '--', '[', 'bash', ']']);
        } catch (e) {
            throw e;
        } finally {
            sandbox.restore();
        }
    });
});
