
import { GoogleGenAI, Type } from "@google/genai";
import { WasteType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Captures a frame from a video element and converts it to a base64 encoded string.
 * @param videoElement The HTMLVideoElement to capture from.
 * @returns A base64 encoded string of the captured frame in JPEG format.
 */
const captureFrame = (videoElement: HTMLVideoElement): string => {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Could not get 2D context from canvas.');
    }
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    // Use a lower quality for faster uploads in a real-time scenario
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    return dataUrl.split(',')[1]; // Return only the base64 part
};

const classificationSchema = {
    type: Type.OBJECT,
    properties: {
        classification: {
            type: Type.STRING,
            description: "The classification of the waste, which can be 'PLASTIC', 'NON_PLASTIC', or 'UNKNOWN'.",
            enum: ['PLASTIC', 'NON_PLASTIC', 'UNKNOWN'],
        },
        confidence: {
            type: Type.NUMBER,
            description: "A confidence score between 0.0 and 1.0 indicating the certainty of the classification.",
        },
    },
    required: ['classification', 'confidence'],
};


/**
 * Classifies the waste in an image from a video feed using the Gemini API.
 * 
 * @param videoElement The HTMLVideoElement displaying the webcam feed.
 * @returns A promise that resolves to a WasteType.
 * @throws {Error} If the API call or response parsing fails.
 */
export const classifyWaste = async (videoElement: HTMLVideoElement): Promise<WasteType> => {
    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        return WasteType.UNKNOWN;
    }

    const base64Image = captureFrame(videoElement);

    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
        },
    };

    const textPart = {
        text: `Analyze the main object in this image. Consider its texture, shape, reflectiveness, and typical use. 
        Classify it as 'PLASTIC' or 'NON_PLASTIC'. If you are uncertain, classify it as 'UNKNOWN'. 
        Provide your response in JSON format according to the provided schema.`,
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: classificationSchema,
            // Disable thinking for faster, more consistent responses in this real-time classification task.
            thinkingConfig: { thinkingBudget: 0 }
        }
    });

    const resultJson = JSON.parse(response.text);
    const { classification, confidence } = resultJson;

    // Only accept classifications with high confidence to avoid ambiguity.
    if (confidence < 0.75) {
        return WasteType.UNKNOWN;
    }

    switch (classification) {
        case WasteType.PLASTIC:
            return WasteType.PLASTIC;
        case WasteType.NON_PLASTIC:
            return WasteType.NON_PLASTIC;
        default:
            return WasteType.UNKNOWN;
    }
};