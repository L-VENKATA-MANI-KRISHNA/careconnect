const Notification = require('../models/Notification');

const createNotification = async ({
  userId,
  type = 'GENERAL',
  title,
  message,
  relatedEntity = {},
}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedEntity,
    });
    return notification;
  } catch (err) {
    console.error(`[Notification Creation Failed] ${err.message}`);
    return null;
  }
};

module.exports = {
  createNotification,
};
