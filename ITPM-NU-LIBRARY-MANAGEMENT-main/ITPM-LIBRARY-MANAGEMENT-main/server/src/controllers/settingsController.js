const asyncHandler = require("express-async-handler");
const SystemSetting = require("../models/SystemSetting");

const defaultSettings = [
  {
    key: "borrowPeriodDays",
    label: "Borrow Period",
    value: Number(process.env.BORROW_PERIOD_DAYS || 14),
    description: "Default book issue duration in days.",
  },
  {
    key: "dailyFineRate",
    label: "Daily Fine Rate",
    value: Number(process.env.DAILY_FINE_RATE || 25),
    description: "Fine charged per overdue day.",
  },
  {
    key: "reservationPickupDays",
    label: "Reservation Pickup Window",
    value: 2,
    description: "Days a notified student can collect a reserved book.",
  },
  {
    key: "emailReminderLeadDays",
    label: "Reminder Lead Days",
    value: 2,
    description: "Days before due date that reminder emails are sent.",
  },
];

const ensureDefaults = async () => {
  await Promise.all(
    defaultSettings.map((setting) =>
      SystemSetting.findOneAndUpdate({ key: setting.key }, setting, { upsert: true, new: true })
    )
  );
};

const getSettings = asyncHandler(async (req, res) => {
  await ensureDefaults();
  const settings = await SystemSetting.find().sort({ label: 1 });
  res.json(settings);
});

const updateSetting = asyncHandler(async (req, res) => {
  const setting = await SystemSetting.findByIdAndUpdate(
    req.params.id,
    { value: req.body.value, label: req.body.label, description: req.body.description },
    { new: true }
  );

  if (!setting) {
    res.status(404);
    throw new Error("Setting not found.");
  }

  res.json(setting);
});

module.exports = {
  getSettings,
  updateSetting,
};

