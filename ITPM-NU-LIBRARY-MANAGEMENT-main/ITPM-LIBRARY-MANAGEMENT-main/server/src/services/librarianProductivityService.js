const LibrarianActivity = require("../models/LibrarianActivity");

const recordProductivityActivity = async ({ actor, activityType, count = 1, taskName = "" }) => {
  if (!actor || actor.role !== "Librarian") {
    return null;
  }

  return LibrarianActivity.create({
    librarian: actor._id,
    activityType,
    count,
    taskName,
  });
};

module.exports = {
  recordProductivityActivity,
};
