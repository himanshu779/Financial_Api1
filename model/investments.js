const mongoose = require('mongoose');
const InvestmentSchema = mongoose.Schema({
    amount: { type: Number, required: true },
    roi: { type: Number, required: true },
    holdingPeriod: { type: Number, required: true },
    startDate: { type: Date, required: true },
    expiryDate: { type: Date},
    status: { type: Boolean, default: false },
    returnAmount: { type: Number },
    userId: {type: String , required: true}
});

module.exports = mongoose.model('Investment', InvestmentSchema);