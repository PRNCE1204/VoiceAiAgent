import User from "../Models/user.model.js"
import { encrypt } from "../utils/crypto.js"
import Conversation from "../Models/conversation.model.js"


export const getCurrentUser = async (req,res) => {
    try {
        const user = await User.findById(req.userId)
        if(!user){
            return res.status(404).json({message:"Failed to get current user"})
        }
        
        // Convert user document to object and mask the API key for client-side safety
        const userObj = user.toObject();
        if (userObj.geminiApiKey) {
            userObj.geminiApiKey = "••••••••••••••••";
        }
        
        return res.status(200).json(userObj)
    } catch (error) {
        console.log(error)
         return res.status(500).json({message:`getCurrentUser error ${error}`})
    }
}


export const saveAssistant = async (req,res) => {
    try {
        const {
        assistantName,
        businessName,
        businessType,
        businessDescription,
        tone,
        theme,
        geminiApiKey,
        pages,
        assistantAvatar,
        voiceGender,
        widgetPlacement,
        welcomeGreeting,
        } = req.body

        const user = await User.findById(req.userId)
        if(!user){
            return res.status(404).json({message:"Failed to get current user"})
        }
        user.assistantName = assistantName;
        user.businessName = businessName;
        user.businessType = businessType;
        user.businessDescription = businessDescription;
        user.tone = tone;
        user.theme = theme;
        user.assistantAvatar = assistantAvatar || "";
        
        if (voiceGender) user.voiceGender = voiceGender;
        if (widgetPlacement) user.widgetPlacement = widgetPlacement;
        if (welcomeGreeting !== undefined) user.welcomeGreeting = welcomeGreeting;

        if(geminiApiKey){
            if (geminiApiKey !== "••••••••••••••••") {
                user.geminiApiKey = encrypt(geminiApiKey);
            }
        }
        user.geminiStatus = "active";
        user.pages = pages || [];

        user.isSetupComplete = true
        await user.save()

        return res.status(200).json({ message:
          "Assistant saved successfully",
        user})
    } catch (error) {
        return res.status(500).json({message:`failed to save Assistant ${error}`})
    }
}

export const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({ userId: req.userId })
            .sort({ updatedAt: -1 });
        return res.status(200).json(conversations);
    } catch (error) {
        console.error("Failed to fetch conversations:", error);
        return res.status(500).json({ message: `Failed to fetch conversations ${error}` });
    }
};

