const moment = require('moment');

const formatMessage = ({ fromUser, toUser, msg }) => {
    const message = {
        from: fromUser,
        to: toUser,
        message: msg,
        date: moment().format("YYYY-MM-DD"),
        time: moment().format("hh:mm a"), // 12-hour format
        timestamp: moment().toISOString() // optional, useful for sorting
    };
    return message;
};

module.exports = formatMessage;
