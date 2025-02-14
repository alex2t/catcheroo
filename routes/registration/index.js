const express = require('express');
const router = express.Router();

router.use(require('./login'));
router.use(require('./register'));
router.use(require('./setPassword'));
router.use(require('./resetPassword'));
router.use(require('./forgotpassword'));

module.exports = router;
