const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName:  { type: String, required: true },
  lastName:   { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  phone:      { type: String, default: "" },
  username:   { type: String, default: "" },
  role:       { type: String, enum: ["admin", "employee"], default: "employee" },
  dept:       { type: String, default: "General" },
  jobTitle:   { type: String, default: "" },
  company:    { type: String, default: "" },
  university: { type: String, default: "" },
  status:     { type: String, enum: ["Active", "On Leave", "Inactive"], default: "Active" },
  salary:     { type: Number, default: 0 },
  payrollStatus: { type: String, enum: ["Paid", "Pending", "On Hold"], default: "Pending" },
  bloodGroup: { type: String, default: "" },
  gender:     { type: String, default: "" },
  image:      { type: String, default: "" },
  address: {
    street:  { type: String, default: "" },
    city:    { type: String, default: "" },
    state:   { type: String, default: "" },
    country: { type: String, default: "" },
  },
  resetOTP:       { type: String,  default: null },
resetOTPExpiry: { type: Date,    default: null },
  
}, { timestamps: true });

// Replace the pre-save hook with this:
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Replace matchPassword with this:
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model("User", userSchema);