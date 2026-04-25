const Fine = require("../models/Fine");
const { getOverdueDays } = require("../utils/dateUtils");
const { getRuntimeSettings } = require("./systemSettingsService");

const calculateFineAmount = async (dueDate, returnedAt = new Date()) => {
  const runtimeSettings = await getRuntimeSettings();
  const overdueDays = getOverdueDays(dueDate, returnedAt);
  return overdueDays * runtimeSettings.dailyFineRate;
};

const upsertFineForBorrow = async ({ borrow, userId, reason = "Overdue return" }) => {
  const amount = await calculateFineAmount(borrow.dueDate, borrow.returnedAt || new Date());

  if (!amount) {
    return null;
  }

  const fine = await Fine.findOneAndUpdate(
    { borrow: borrow._id },
    {
      user: userId,
      borrow: borrow._id,
      amount,
      reason,
      status: "Unpaid",
    },
    { new: true, upsert: true }
  );

  return fine;
};

module.exports = {
  calculateFineAmount,
  upsertFineForBorrow,
};

