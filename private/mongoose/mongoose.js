let mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/db');

module.exports = mongoose;