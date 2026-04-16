const asyncHandler = require("express-async-handler");
const Fine = require("../models/Fine");
const { logActivity } = require("../services/activityService");

const getFines = asyncHandler(async (req, res) => {
  const query = req.user.role === "Student" ? { user: req.user._id } : {};
  const fines = await Fine.find(query)
    .populate("user", "name email studentId")
    .populate({
      path: "borrow",
      populate: { path: "book", select: "title isbn coverImage" },
    })
    .sort({ createdAt: -1 });

  res.json(fines);
});

const updateFineStatus = asyncHandler(async (req, res) => {
  const fine = await Fine.findById(req.params.id);

  if (!fine) {
    res.status(404);
    throw new Error("Fine not found.");
  }

  fine.status = req.body.status || fine.status;
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

module.exports = {
  getFines,
  updateFineStatus,
};

