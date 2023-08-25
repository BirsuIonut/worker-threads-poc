import { parentPort } from "worker_threads";
import {calculateCount} from "./counter.js";

calculateCount().then((counter) => {
    console.log("Worker counter finished, posting message");
    parentPort.postMessage(counter);
})
