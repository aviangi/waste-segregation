
import React from 'react';
import { WasteType } from '../types';
import { PlasticIcon, NonPlasticIcon, UnknownIcon } from './icons/Icons';

interface ClassificationResultProps {
    result: WasteType;
}

const ClassificationResult: React.FC<ClassificationResultProps> = ({ result }) => {
    const getResultDetails = () => {
        switch (result) {
            case WasteType.PLASTIC:
                return {
                    text: "Plastic Waste",
                    style: "bg-orange-500/20 border-orange-500 text-orange-300",
                    icon: <PlasticIcon />,
                };
            case WasteType.NON_PLASTIC:
                return {
                    text: "Non-Plastic Waste",
                    style: "bg-green-500/20 border-green-500 text-green-300",
                    icon: <NonPlasticIcon />,
                };
            default:
                return {
                    text: "Scanning...",
                    style: "bg-gray-700/50 border-gray-600 text-gray-400",
                    icon: <UnknownIcon />,
                };
        }
    };

    const { text, style, icon } = getResultDetails();

    return (
        <div className={`p-4 md:p-6 rounded-xl text-center shadow-lg border transition-all duration-500 ease-in-out ${style}`}>
             <div className="flex items-center justify-center gap-4">
                <div className="w-10 h-10">{icon}</div>
                <p className="text-2xl md:text-3xl font-bold tracking-wider">{text}</p>
            </div>
        </div>
    );
};

export default ClassificationResult;
