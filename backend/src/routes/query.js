const express = require('express');
const { translate } = require('../controllers/queryController');

const router = express.Router();

router.post('/translate', translate);

module.exports = router;
