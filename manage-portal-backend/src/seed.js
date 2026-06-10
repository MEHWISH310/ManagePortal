const mongoose     = require("mongoose");
const dotenv       = require("dotenv");
const User         = require("./models/User");
const Announcement = require("./models/Announcement");
const Notification = require("./models/Notification");
const Task         = require("./models/Task");

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // ── Admin ──
    await User.deleteOne({ email: "admin@centralpark.in" });
    const admin = await User.create({
      firstName:  "Admin",
      lastName:   "User",
      email:      "admin@centralpark.in",
      password:   "Admin@123",
      role:       "admin",
      dept:       "Management",
      jobTitle:   "System Administrator",
      company:    "Central Park Corp",
      university: "IIT Delhi",
      status:     "Active",
      salary:     100000,
      phone:      "+91 98100 00001",
      username:   "admin.user",
      age:        35,
      gender:     "male",
      bloodGroup: "O+",
      image:      "",
      address: {
        street:  "12 MG Road",
        city:    "Mumbai",
        state:   "Maharashtra",
        country: "India",
      },
    });
    console.log("Admin created:", admin.email);

    // ── Employee ──
    await User.deleteOne({ email: "employee@centralpark.in" });
    const emp = await User.create({
      firstName:  "Test",
      lastName:   "Employee",
      email:      "employee@centralpark.in",
      password:   "Employee@123",
      role:       "employee",
      dept:       "Engineering",
      jobTitle:   "Developer",
      company:    "Central Park Corp",
      university: "VIT Vellore",
      status:     "Active",
      salary:     75000,
      phone:      "+91 98200 00002",
      username:   "test.employee",
      age:        24,
      gender:     "female",
      bloodGroup: "B+",
      image:      "",
      address: {
        street:  "45 Brigade Road",
        city:    "Bangalore",
        state:   "Karnataka",
        country: "India",
      },
    });
    console.log("Employee created:", emp.email);

    // ── Announcements ──
    await Announcement.deleteMany({});
    await Announcement.insertMany([
      { title: "Q2 Appraisal Cycle Begins",       body: "The Q2 performance review cycle kicks off this week. All managers must submit team ratings by 10 June.", tags: ["HR"],     createdBy: admin._id },
      { title: "Office Closed on 29th May",        body: "In observance of the national holiday, all offices will remain closed on Thursday, 29 May.",             tags: ["Admin"],  createdBy: admin._id },
      { title: "New Work From Home Policy",        body: "The updated WFH policy allows up to 8 days per month for eligible roles.",                                tags: ["Policy"], createdBy: admin._id },
      { title: "Mandatory Cybersecurity Training", body: "All employees must complete the annual cybersecurity awareness module by 31 May.",                        tags: ["IT"],     createdBy: admin._id },
    ]);
    console.log("Announcements seeded!");

    // ── Notifications ──
    await Notification.deleteMany({});
    await Notification.insertMany([
      { title: "May payroll processed successfully", sub: "All salaries have been disbursed",        type: "payroll",  recipient: null,      createdBy: admin._id },
      { title: "Q2 Appraisal Cycle Begins",         sub: "Posted by HR team",                       type: "announce", recipient: null,      createdBy: admin._id },
      { title: "Office closed 29th May",            sub: "National holiday — no WFH",               type: "system",   recipient: null,      createdBy: admin._id },
      { title: "Leave request pending review",      sub: "Anjali Gupta — Medical · 5 days",         type: "leave",    recipient: admin._id, createdBy: admin._id },
      { title: "New employee added",                sub: "Test Employee joined Engineering",         type: "system",   recipient: admin._id, createdBy: admin._id },
      { title: "May payslip is ready",              sub: "Net pay: ₹75,000 · Credited 1 Jun",       type: "payroll",  recipient: emp._id,   createdBy: admin._id },
      { title: "Your Earned Leave was approved",    sub: "2 Jun – 6 Jun · 5 days approved",         type: "leave",    recipient: emp._id,   createdBy: admin._id },
      { title: "Task due today",                    sub: "Complete Q2 performance review · High",   type: "task",     recipient: emp._id,   createdBy: admin._id },
    ]);
    console.log("Notifications seeded!");

    // ── Tasks ──
    await Task.deleteMany({});
    await Task.insertMany([
      { title: "Complete Q2 performance review", priority: "High",   due: "2026-06-28", tag: "HR",      userId: emp._id,   done: false },
      { title: "Review onboarding documents",    priority: "Medium", due: "2026-06-30", tag: "Admin",   userId: emp._id,   done: true  },
      { title: "Update skill assessment form",   priority: "Low",    due: "2026-07-05", tag: "HR",      userId: emp._id,   done: false },
      { title: "Team retrospective notes",       priority: "Medium", due: "2026-06-29", tag: "Team",    userId: emp._id,   done: true  },
    ]);
    console.log("Tasks seeded!");

    console.log("Seeding done!");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
};

seed();