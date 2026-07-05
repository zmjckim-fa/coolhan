'use strict';
// Tiny app under test. R1: add(2,3)===5. R2: sub(5,3)===2.
function add(a, b) { return a + b; }
function sub(a, b) { return a + b; } // BUG (S3): wrong impl to force a real failing acceptance test
module.exports = { add, sub };
