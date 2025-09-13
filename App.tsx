
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WasteType } from './types';
import { classifyWaste } from './services/wasteClassifier';
import WebcamCapture from './components/WebcamCapture';
import ClassificationResult from './components/ClassificationResult';
import { CameraIcon, NoCameraIcon } from './components/icons/Icons';

const App: React.FC = () => {
    const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [classification, setClassification] = useState<WasteType>(WasteType.UNKNOWN);
    const [error, setError] = useState<string | null>(null);
    const [classificationError, setClassificationError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    // Fix: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility.
    const classificationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopClassification = useCallback(() => {
        if (classificationIntervalRef.current) {
            clearInterval(classificationIntervalRef.current);
            classificationIntervalRef.current = null;
        }
    }, []);

    const startClassification = useCallback(() => {
        stopClassification();
        classificationIntervalRef.current = setInterval(async () => {
            if (videoRef.current) {
                try {
                    const result = await classifyWaste(videoRef.current);
                    setClassification(result);
                    // Clear previous error on a successful run
                    if (classificationError) {
                        setClassificationError(null);
                    }
                } catch (err) {
                    console.error("Classification failed:", err);
                    setClassificationError("Classification failed. Please check your network connection.");
                    // Set to UNKNOWN so the UI shows "Scanning..." with the error message
                    setClassification(WasteType.UNKNOWN);
                }
            }
        }, 2000); // Classify every 2 seconds
    }, [stopClassification, classificationError]);


    const startCamera = async () => {
        setError(null);
        setClassificationError(null);
        setClassification(WasteType.UNKNOWN);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false,
            });
            setStream(mediaStream);
            setIsCameraActive(true);
        } catch (err) {
            let message = "An unexpected error occurred while accessing the camera. Please try again.";
            if (err instanceof DOMException) {
                if (err.name === 'NotAllowedError') {
                    message = "Camera access denied. Please enable camera permissions for this site in your browser settings.";
                } else if (err.name === 'NotFoundError') {
                    message = "No camera found. Please ensure a camera is connected and enabled.";
                }
            }
            console.error("Error accessing webcam:", err);
            setError(message);
            setIsCameraActive(false);
        }
    };

    const stopCamera = useCallback(() => {
        stopClassification();
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        setIsCameraActive(false);
        setClassification(WasteType.UNKNOWN);
        setClassificationError(null);
    }, [stream, stopClassification]);


    useEffect(() => {
        if (isCameraActive) {
            startClassification();
        } else {
            stopClassification();
        }

        return () => {
            stopClassification();
        };
    }, [isCameraActive, startClassification, stopClassification]);

    // Cleanup stream on component unmount
    useEffect(() => {
      return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
      };
    }, [stream]);

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
                <header className="text-center mb-6">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                        Waste Sorter AI
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Point your camera at an item to classify it.</p>
                </header>

                <main className="w-full bg-gray-800/50 rounded-2xl shadow-2xl p-4 md:p-6 border border-gray-700 flex flex-col items-center">
                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg text-center mb-4 w-full max-w-2xl">
                            <p className="font-semibold">Camera Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    
                    <div className="w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden relative flex items-center justify-center border-2 border-gray-700">
                        {isCameraActive && stream ? (
                            <WebcamCapture stream={stream} ref={videoRef} />
                        ) : (
                            <div className="text-gray-500 flex flex-col items-center">
                                <NoCameraIcon />
                                <span className="mt-2">Camera is off</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-6 w-full max-w-2xl">
                         <ClassificationResult result={classification} />
                         {classificationError && (
                            <div className="mt-4 text-center text-red-300 bg-red-500/20 border border-red-500 p-3 rounded-xl text-sm">
                                <p>{classificationError}</p>
                            </div>
                         )}
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={isCameraActive ? stopCamera : startCamera}
                            className={`px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 ease-in-out flex items-center gap-3 shadow-lg transform hover:scale-105 focus:outline-none focus:ring-4 ${
                                isCameraActive 
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500/50 text-white' 
                                : 'bg-green-500 hover:bg-green-600 focus:ring-green-500/50 text-white'
                            }`}
                        >
                            <CameraIcon />
                            {isCameraActive ? 'Stop Camera' : 'Start Camera'}
                        </button>
                    </div>
                </main>
                
                <footer className="mt-8 text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Waste Sorter AI. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;