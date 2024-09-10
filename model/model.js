const mongoose = require('mongoose');
const Investment = require('./investments');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'user',
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true  
    },
    hobbies: {
        type: [String],
        required:true
    },
    otp: { type: String },
    otpExpires: { type: Date },
    investments: [Investment.schema]
},
{
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);