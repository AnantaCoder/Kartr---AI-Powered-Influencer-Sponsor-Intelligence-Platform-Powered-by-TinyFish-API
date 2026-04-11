import { combineReducers } from "@reduxjs/toolkit";
import { authReducer } from "../features/auth";
import youtubeReducer from "./slices/youtubeSlice";
import bulkAnalysisReducer from "./slices/bulkAnalysisSlice";
import chatReducer from "./slices/chatSlice";
import uiReducer from "./slices/uiSlice";
import adminReducer from "./slices/adminSlice";
import campaignReducer from "./slices/campaignSlice";
import discoveryReducer from "./slices/discoverySlice";
import trackingReducer from "./slices/trackingSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  youtube: youtubeReducer,
  bulkAnalysis: bulkAnalysisReducer,
  chat: chatReducer,
  ui: uiReducer,
  admin: adminReducer,
  campaigns: campaignReducer,
  discovery: discoveryReducer,
  tracking: trackingReducer,
});

export default rootReducer;
