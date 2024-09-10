const mongoose = require("mongoose");
const Investment = require("./investments");
const investmentLedgerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  credit: {
    type: Number,
    default: null,
  },
  debit: {
    type: Number,
    required: true,
  },
  amount: { type: Number, required: true },
  roi: { type: Number, required: true },
  holdingPeriod: { type: Number, required: true },
  startDate: { type: Date, required: true },
  expiryDate: { type: Date },
  status: { type: Boolean, default: false },
});
module.exports = mongoose.model("InvestmentLedger", investmentLedgerSchema);
//  module.exports = InvestmentLedger;
