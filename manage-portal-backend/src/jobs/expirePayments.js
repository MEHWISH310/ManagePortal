const cron    = require("node-cron");
const Payment = require("../models/Payment");

function startExpirePaymentsJob() {
  // Runs every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    try {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const result = await Payment.updateMany(
        {
          status:    "created",
          createdAt: { $lt: fourHoursAgo },
        },
        { $set: { status: "failed" } }
      );
      if (result.modifiedCount > 0) {
        console.log(`[CronJob] ${result.modifiedCount} pending payment(s) marked as failed.`);
      }
    } catch (err) {
      console.error("[CronJob] Error expiring payments:", err.message);
    }
  });

  console.log("[CronJob] Expire payments job started.");
}

module.exports = { startExpirePaymentsJob };