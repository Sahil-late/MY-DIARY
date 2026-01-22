import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
    password: {
    type: String,
  },
    occupation: {
    type: String,
  }
});
const User = mongoose.model("User", UserSchema);
export default User;