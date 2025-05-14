'use client';
import React, { useEffect, useRef, useState } from 'react';

interface Prediction {
  label: string;
  confidence: number;
  bbox: number[];
}

const labelTranslationsSL: { [key: string]: string } = {
  hello: 'สวัสดี',
  thankyou: 'ขอบคุณ',
};

const labelTranslationsTH: { [key: string]: string } = {
  history1: 'อาการทางประวัติ 1',
  history2: 'อาการทางประวัติ 2',
};

const getLabelTranslations = (model: string) => {
  return model === 'TH' ? labelTranslationsTH : labelTranslationsSL;
};

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  return '#' + Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * 16)]).join('');
};

const SignLanguagePage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [allLabels, setAllLabels] = useState<{ [label: string]: number }>({});
  const [labelColors, setLabelColors] = useState<{ [key: string]: string }>({});
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [model, setModel] = useState<'SL' | 'TH'>('SL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    setAllLabels({});
    setLabelColors({});
  }, [model]);

  useEffect(() => {
    let isMounted = true;

    const connectWebSocket = () => {
      const ws = new WebSocket('wss://dcb4-49-228-238-45.ngrok-free.app/ws/predict/');
      socketRef.current = ws;

      ws.onopen = () => {
        setErrorMessage(null);
        reconnectAttemptsRef.current = 0;
        if (isMounted) {
          intervalRef.current = setInterval(() => sendFrameToServer(model), 200);
        }
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data)) {
            updateLabels(data);
            drawPredictions(data);
          } else if (data.error) {
            setErrorMessage(`ข้อผิดพลาดจากเซิร์ฟเวอร์: ${data.error}`);
          }
        } catch {
          setErrorMessage('ข้อผิดพลาดในการประมวลผลข้อมูลจากเซิร์ฟเวอร์');
        }
      };

      ws.onclose = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (isMounted && isCameraActive && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          setErrorMessage(`เชื่อมต่อใหม่ ${reconnectAttemptsRef.current}/${maxReconnectAttempts}...`);
          setTimeout(() => {
            if (isMounted && isCameraActive) connectWebSocket();
          }, 5000);
        } else if (isMounted) {
          setErrorMessage('ไม่สามารถเชื่อมต่อ WebSocket ได้');
        }
      };

      ws.onerror = () => {
        if (isMounted) setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ WebSocket');
      };
    };

    const startCameraAndSocket = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (isMounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
        connectWebSocket();
      } catch {
        if (isMounted) setErrorMessage('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาต');
      }
    };

    const stopCameraAndSocket = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (socketRef.current) socketRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      clearCanvas();
      setAllLabels({});
      setLabelColors({});
      setErrorMessage(null);
      reconnectAttemptsRef.current = 0;
    };

    const sendFrameToServer = (selectedModel: 'SL' | 'TH') => {
      const video = videoRef.current;
      const socket = socketRef.current;
      const canvas = canvasRef.current;
      if (!video || !socket || !canvas || socket.readyState !== WebSocket.OPEN) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.7);

      socket.send(JSON.stringify({ model: selectedModel, image: imageData }));
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext('2d');
        if (context) context.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const updateLabels = (predictions: Prediction[]) => {
      setLabelColors((prev) => {
        const updated = { ...prev };
        predictions.forEach((pred) => {
          if (!updated[pred.label]) updated[pred.label] = getRandomColor();
        });
        return updated;
      });

      setAllLabels((prev) => {
        const updated = { ...prev };
        predictions.forEach((pred) => {
          updated[pred.label] = pred.confidence;
        });
        return updated;
      });
    };

    const drawPredictions = (predictions: Prediction[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.clearRect(0, 0, canvas.width, canvas.height);

      predictions.forEach((prediction) => {
        const color = labelColors[prediction.label];
        const [x1, y1, x2, y2] = prediction.bbox;

        context.strokeStyle = color;
        context.lineWidth = 3;
        context.strokeRect(x1, y1, x2 - x1, y2 - y1);
        context.fillStyle = color;
        context.font = 'bold 16px sans-serif';

        const labelText = `${getLabelTranslations(model)[prediction.label] || prediction.label} (${(prediction.confidence * 100).toFixed(1)}%)`;
        context.fillText(labelText, x1 + 5, y1 > 20 ? y1 - 5 : y1 + 15);
      });
    };

    if (isCameraActive) startCameraAndSocket();
    else stopCameraAndSocket();

    return () => {
      isMounted = false;
      stopCameraAndSocket();
    };
  }, [isCameraActive, model]);

  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start p-4 bg-gray-100">
      {/* เบลอพื้นหลังเมื่อเปิดกล้อง */}
      {isCameraActive && (
        <div className="absolute inset-0 backdrop-blur-md z-0"></div>
      )}

      <div className="z-10 w-full max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold text-center">ระบบแปลภาษามือแบบเรียลไทม์</h1>

        <div className="flex justify-center gap-4">
          <button
            onClick={toggleCamera}
            className={`px-4 py-2 rounded text-white ${isCameraActive ? 'bg-red-500' : 'bg-green-500'}`}
          >
            {isCameraActive ? 'ปิดกล้อง' : 'เปิดกล้อง'}
          </button>

          <select
            value={model}
            onChange={(e) => setModel(e.target.value as 'SL' | 'TH')}
            className="px-3 py-2 border rounded"
          >
            <option value="SL">แปลภาษามือ</option>
            <option value="TH">แปลประวัติคนไข้</option>
          </select>
        </div>

        {errorMessage && <p className="text-red-600 text-center">{errorMessage}</p>}

        <div className="relative w-full">
          <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg shadow-md" />
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
        </div>

        <div className="mt-4 space-y-2">
          {Object.entries(allLabels).map(([label, confidence]) => (
            <div key={label} className="flex items-center gap-4">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: labelColors[label] }}></span>
              <span className="flex-1">{getLabelTranslations(model)[label] || label}</span>
              <span className="text-sm text-gray-600">{(confidence * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SignLanguagePage;

