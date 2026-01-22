import mongoose from "mongoose";
const storeSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
    sidebar: {
    type: String,
  },
    header: {
    type: String,
    required: true,
  },
  page:{
    type: Number,
    required: true,
  },
  date:{
    type:String,
    required:true,
  },
  username:{
    type:String,
    required:true,
  }
});
const Store = mongoose.model("Store", storeSchema);
export default Store;