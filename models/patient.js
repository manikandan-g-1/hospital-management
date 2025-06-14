const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    sno: Number,
    name: String,
    disease: String,
    doctor: String,     // Added doctor field
    room: String,       // Added room field
    admitted: Boolean
});

module.exports = mongoose.model('Patient', patientSchema);
