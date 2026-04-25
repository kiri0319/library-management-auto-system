const SystemSetting = require("../models/SystemSetting");

const DEFAULTS = {
  borrowPeriodDays: Number(process.env.BORROW_PERIOD_DAYS || 14),
  dailyFineRate: Number(process.env.DAILY_FINE_RATE || 25),
  reservationPickupDays: 2,
};

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getRuntimeSettings = async () => {
  const settings = await SystemSetting.find({
    key: { $in: ["borrowPeriodDays", "dailyFineRate", "reservationPickupDays"] },
  }).select("key value");

  const settingsMap = new Map(settings.map((setting) => [setting.key, setting.value]));

  return {
    borrowPeriodDays: toPositiveNumber(settingsMap.get("borrowPeriodDays"), DEFAULTS.borrowPeriodDays),
    dailyFineRate: toPositiveNumber(settingsMap.get("dailyFineRate"), DEFAULTS.dailyFineRate),
    reservationPickupDays: toPositiveNumber(settingsMap.get("reservationPickupDays"), DEFAULTS.reservationPickupDays),
  };
};

module.exports = {
  getRuntimeSettings,
};
