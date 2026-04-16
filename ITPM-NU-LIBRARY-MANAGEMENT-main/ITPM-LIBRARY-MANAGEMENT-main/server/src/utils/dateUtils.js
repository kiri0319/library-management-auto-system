const getBorrowPeriodDays = () => Number(process.env.BORROW_PERIOD_DAYS || 14);
const getDailyFineRate = () => Number(process.env.DAILY_FINE_RATE || 25);

const calculateDueDate = (borrowDate = new Date()) => {
  const dueDate = new Date(borrowDate);
  dueDate.setDate(dueDate.getDate() + getBorrowPeriodDays());
  return dueDate;
};

const getOverdueDays = (dueDate, returnDate = new Date()) => {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);

  if (returned <= due) {
    return 0;
  }

  const diffMs = returned.setHours(0, 0, 0, 0) - due.setHours(0, 0, 0, 0);
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const getStockStatus = (book) => {
  if (book.availableCopies <= 0) {
    return "Out of Stock";
  }

  if (book.availableCopies <= Math.max(2, Math.floor(book.quantity * 0.2))) {
    return "Limited Stock";
  }

  return "Available";
};

module.exports = {
  calculateDueDate,
  getBorrowPeriodDays,
  getDailyFineRate,
  getOverdueDays,
  getStockStatus,
};

