// hvigor-wrapper.js — bootstraps hvigor from the DevEco-bundled local path
'use strict';
const path = require('path');
const hvigorPath = path.resolve(
  '/Applications/DevEco-Studio.app/Contents/tools/hvigor/hvigor'
);
require(hvigorPath);
