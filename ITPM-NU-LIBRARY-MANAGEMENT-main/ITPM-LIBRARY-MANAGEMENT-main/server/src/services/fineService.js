const Fine = require("../models/Fine");
const { getDailyFineRate, getOverdueDays } = require("../utils/dateUtils");

const calculateFineAmount = (dueDate, returnedAt = new Date()) => {
  const overdueDays = getOverdueDays(dueDate, returnedAt);
  return overdueDays * getDailyFineRate();
};

const upsertFineForBorrow = async ({ borrow, userId, reason = "Overdue return" }) => {
  const amount = calculateFineAmount(borrow.dueDate, borrow.returnedAt || new Date());

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

