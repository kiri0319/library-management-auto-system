const asyncHandler = require("express-async-handler");
const Fine = require("../models/Fine");
const { logActivity } = require("../services/activityService");
const { getRuntimeSettings } = require("../services/systemSettingsService");
const { calculateFineAmount } = require("../services/fineService");

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const getOverdueDays = (borrow) => {
  if (!borrow?.dueDate) {
    return 0;
  }

  const dueDate = new Date(borrow.dueDate);
  const endDate = borrow.returnedAt ? new Date(borrow.returnedAt) : new Date();
  const diff = endDate.getTime() - dueDate.getTime();

  if (diff <= 0) {
    return 0;
  }

  return Math.ceil(diff / DAY_IN_MS);
};

const getFines = asyncHandler(async (req, res) => {
  const query = req.user.role === "Student" ? { user: req.user._id } : {};
  const fines = await Fine.find(query)
    .populate("user", "name email studentId")
    .populate({
      path: "borrow",
      populate: { path: "book", select: "title isbn coverImage" },
    })
    .sort({ createdAt: -1 });

  const runtimeSettings = await getRuntimeSettings();
  const dailyRate = runtimeSettings.dailyFineRate;
  const enrichedFines = fines.map((fine) => {
    const overdueDays = getOverdueDays(fine.borrow);
    const calculatedAmount = overdueDays * dailyRate;

    return {
      ...fine.toObject(),
      overdueDays,
      dailyRate,
      calculatedAmount,
    };
  });

  res.json(enrichedFines);
});

const updateFineStatus = asyncHandler(async (req, res) => {
  const fine = await Fine.findById(req.params.id);

  if (!fine) {
    res.status(404);
    throw new Error("Fine not found.");
  }

  const requestedStatus = req.body.status;
  const allowedStatuses = ["Paid"];
  if (!allowedStatuses.includes(requestedStatus)) {
    res.status(400);
    throw new Error("Status must be Paid.");
  }

  if (fine.status !== "Unpaid") {
    res.status(409);
    throw new Error("Fine status is locked after approval. It cannot be changed again.");
  }

  fine.status = requestedStatus;
  fine.paidAt = fine.status === "Paid" ? new Date() : fine.paidAt;
  await fine.save();

  await logActivity({
    actor: req.user._id,
    actorRole: req.user.role,
    action: "UPDATE_FINE",
    module: "FINES",
    targetType: "Fine",
    targetId: fine._id.toString(),
    description: `${req.user.name} changed fine status to ${fine.status}.`,
  });

  res.json(fine);
});

const recalculateUnpaidFines = asyncHandler(async (req, res) => {
  const unpaidFines = await Fine.find({ status: "Unpaid" })
    .populate("borrow", "dueDate returnedAt");

  let updatedCount = 0;
  for (const fine of unpaidFines) {
    if (!fine.borrow?.dueDate) {
      continue;
    }
    const nextAmount = await calculateFineAmount(
      fine.borrow.dueDate,
      fine.borrow.returnedAt || new Date()
    );
    if (fine.amount !== nextAmount) {
      fine.amount = nextAmount;
      await fine.save();
      updatedCount += 1;
    }
  }

  await logActivity({
    actor: req.user._id,
    actorRole: req.user.role,
    action: "RECALCULATE_FINE",
    module: "FINES",
    targetType: "Fine",
    targetId: "batch-unpaid",
    description: `${req.user.name} recalculated ${updatedCount} unpaid fine records.`,
    ipAddress: req.ip,
  });

  res.json({
    message: `Recalculated ${updatedCount} unpaid fine record(s).`,
    updatedCount,
  });
});

module.exports = {
  getFines,
  updateFineStatus,
  recalculateUnpaidFines,
};

