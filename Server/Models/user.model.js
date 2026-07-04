import mongoose from "mongoose";

const pageSchema = new mongoose.Schema(
    {
    name: String,

    path: String,

    keywords: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
)

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    assistantName:{
        type:String,
        default:"Voxa"
    },
    businessName:{
        type:String,
        default:""
    },
    businessType:{
        type:String,
        default:""
    },
    businessDescription:{
        type:String,
        default:""
    },
    tone:{
        type:String,
        enum: [
        "friendly",
        "professional",
        "sales",
      ],
      default:"friendly"
    },
    theme:{
        type:String,
        enum:[
        "light",
        "dark",
        "glass",
        "neon",
      ],
      default:"dark"
    },
    enableVoice:{
        type:Boolean,
        default:true
    },
    pages:{
        type:[pageSchema],
        default:[]
    },
    enableNavigation:{
        type:Boolean,
        default:true
    },
    assistantAvatar:{
        type:String,
        default:""
    },
    geminiApiKey:{
        type:String,
        default:""
    },
    geminiStatus:{
        type:String,
        enum:[
        "active",
        "quota_exceeded",
        "invalid",
      ],
      default:"active"
    },
    totalMessages:{
        type:Number,
        default:0
    },
    plan:{
        type:String,
        enum:["free","pro"],
        default:"free"
    },
    requestLimit: {
      type: Number,
      default: 200,
    },

    proExpiresAt: {
      type: Date,
      default: null,
    },

    isSetupComplete:{
        type:Boolean,
        default:false
    },

    // ── Email/Password Auth Fields ─────────────────────────────────────────
    password: {
        type: String,
        default: null  // null for Google-only users
    },
    authProvider: {
        type: String,
        enum: ["google", "email"],
        default: "google"
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isFirstLogin: {
        type: Boolean,
        default: true  // triggers welcome email on first login
    },
    otp: {
        type: String,
        default: null  // hashed OTP, cleared after use
    },
    otpExpiry: {
        type: Date,
        default: null
    },
    otpPurpose: {
        type: String,
        enum: ["verify_email", "reset_password", null],
        default: null
    }

},{timestamps:true})


const User = mongoose.model("User" ,userSchema)

export default User