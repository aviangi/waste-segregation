
import React, { useEffect, forwardRef } from 'react';

interface WebcamCaptureProps {
    stream: MediaStream;
}

const WebcamCapture = forwardRef<HTMLVideoElement, WebcamCaptureProps>(({ stream }, ref) => {
    const internalVideoRef = React.useRef<HTMLVideoElement>(null);

    React.useImperativeHandle(ref, () => internalVideoRef.current as HTMLVideoElement);

    useEffect(() => {
        if (internalVideoRef.current && stream) {
            internalVideoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <video
            ref={internalVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
        />
    );
});

WebcamCapture.displayName = 'WebcamCapture';

export default WebcamCapture;
