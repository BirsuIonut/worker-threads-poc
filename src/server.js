import  express from 'express';
import { Worker } from 'worker_threads';
import {calculateCount} from "./counter.js";
const app = express();

app.use(express.json());
// increase it to 2 * 1000 to make /non-blocking pass
const expectedTimeout = 1000;

app.get("/blocking", async (req, res) => {
    console.time("Blocking");
    let clearTimeoutId = undefined;

    const clearTimeoutHandle = () => {
        if (clearTimeoutId) {
            console.timeEnd(`Timeout`);
            clearTimeout(clearTimeoutId);
            clearTimeoutId = undefined;
        }
    };

    const timeoutPromise = new Promise((_resolve, reject) => {
        console.time(`Timeout`);
        clearTimeoutId = setTimeout(() => {
            clearTimeoutHandle();
            console.log(`Expected: ${expectedTimeout}`);
            reject(new Error('Data Layer transaction timed out'));
        }, expectedTimeout);
    });

    const countPromise = calculateCount();

    Promise.race([countPromise, timeoutPromise]).then((counter) => {
        res.status(200).send(`result is ${counter}`);
    }).catch(() => {
        res.status(400).send(`timout`);
    }).finally(() =>
        console.timeEnd("Blocking"));
});


app.get("/non-blocking", async (req, res) => {
    console.time("Non blocking");
    const worker = new Worker("./src/worker.js");

    let clearTimeoutId = undefined;

    const clearTimeoutHandle = () => {
        if (clearTimeoutId) {
            console.timeEnd(`Timeout`);
            clearTimeout(clearTimeoutId);
            clearTimeoutId = undefined;
        }
    };

    const timeoutPromise = new Promise((_resolve, reject) => {
        console.time(`Timeout`);
        clearTimeoutId = setTimeout(() => {
            clearTimeoutHandle();
            console.log(`Expected: ${expectedTimeout}`);
            worker.terminate();
            console.time(`Terminate`);
            reject(new Error('Timeout'));
        }, expectedTimeout);
    });

    const countPromise = new Promise((resolve, reject) => {
        worker.on("message", (data) => {
            resolve(data);
            clearTimeoutHandle();
        });
        worker.on("error", (data) => {
            reject(data);
        });
        worker.on("exit", (id) => {
            console.timeEnd(`Terminate`);
            console.log(`Thread ${id} exited`);
        })
    });

    Promise.race([countPromise, timeoutPromise]).then((counter) => {
        res.status(200).send(`result is ${counter}`);
    }).catch(() => {
        res.status(400).send(`timout`);
    }).finally(() => console.timeEnd("Non blocking"));
});

app.listen(8000, () => {
    console.log("App on port: " + 8000);
});
