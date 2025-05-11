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
  // เพิ่ม label อื่นๆ
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
        const labelText = `${getLabelTranslations(model)[prediction.label] || prediction.label}: ${(prediction.confidence * 100).toFixed(1)}%`;
        context.fillText(labelText, x1 + 5, y1 > 20 ? y1 - 5 : y1 + 20);
      });
    };

    if (isCameraActive) startCameraAndSocket();
    else stopCameraAndSocket();

    return () => {
      isMounted = false;
      stopCameraAndSocket();
    };
  }, [isCameraActive, model]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-6 border">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">ระบบแปลภาษามือ & ซักประวัติ</h1>
          <p className="text-gray-500 mt-1">ใช้กล้องเพื่อจับภาพแล้วแปลเป็นข้อความภาษาไทย</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
            <span>{errorMessage}</span>
            <button
              className="text-blue-600 underline"
              onClick={() => {
                setIsCameraActive(false);
                setTimeout(() => setIsCameraActive(true), 100);
              }}
            >
              ลองใหม่
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
          <button
            className={`flex items-center px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              isCameraActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            } text-white`}
            onClick={() => setIsCameraActive((prev) => !prev)}
          >
            {isCameraActive ? 'ปิดกล้อง' : 'เปิดกล้อง'}
          </button>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">โหมด:</label>
            <select
              className="p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={model}
              onChange={(e) => setModel(e.target.value as 'SL' | 'TH')}
            >
              <option value="SL">ภาษามือ</option>
              <option value="TH">ซักประวัติ</option>
            </select>
          </div>
        </div>

        <div className="relative rounded-xl overflow-hidden border shadow-lg mb-6">
          <video ref={videoRef} className="w-full h-auto bg-black" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
        </div>

        {Object.keys(allLabels).length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h2 className="font-semibold text-gray-700 mb-3">ผลการตรวจจับ:</h2>
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs text-gray-500 uppercase bg-gray-200">
                <tr>
                  <th className="px-4 py-2">คำแปล</th>
                  <th className="px-4 py-2">ความมั่นใจ</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(allLabels).map(([label, confidence]) => (
                  <tr key={label} className="border-b">
                    <td className="px-4 py-2" style={{ color: labelColors[label] }}>
                      {getLabelTranslations(model)[label] || label}
                    </td>
                    <td className="px-4 py-2">{(confidence * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignLanguagePage;
