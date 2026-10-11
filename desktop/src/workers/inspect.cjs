'use strict';
const {parentPort,workerData}=require('node:worker_threads');
const {inspectGame}=require('../core/library.cjs');
try {parentPort.postMessage({ok:true,report:inspectGame(workerData)});}
catch(error){parentPort.postMessage({ok:false,error:String(error?.message||error)});}
