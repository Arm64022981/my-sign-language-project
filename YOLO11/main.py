from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketState
from ultralytics import YOLO
import base64
import io
from PIL import Image
import json
import uvicorn
import gc

app = FastAPI()

# ตั้งค่า CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # จำกัด origin ใน production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# โหลดโมเดล YOLO
try:
    model_SL = YOLO(r"D:\my-sign-language-project\YOLO11\sl\best.pt")
    model_TH = YOLO(r"D:\my-sign-language-project\YOLO11\th\best.pt")
    print("โหลดโมเดล YOLO สำเร็จ")
except Exception as e:
    print(f"ข้อผิดพลาดในการโหลดโมเดล: {e}")
    raise e

# HTTP endpoint สำหรับทดสอบ
@app.get("/")
async def read_root():
    print("ได้รับการร้องขอ GET ไปที่ /")
    return {"message": "เซิร์ฟเวอร์ FastAPI กำลังทำงาน"}

# WebSocket endpoint
@app.websocket("/ws/predict/")
async def websocket_endpoint(websocket: WebSocket):
    print("พยายามเชื่อมต่อ WebSocket")
    try:
        await websocket.accept()
        print("เชื่อมต่อ WebSocket สำเร็จ")
        while True:
            try:
                # รับข้อมูลเป็น text และแปลงเป็น JSON
                raw_data = await websocket.receive_text()
                print(f"ได้รับข้อมูลดิบ: {raw_data[:50]}...")  # Log ข้อมูลบางส่วน
                try:
                    data = json.loads(raw_data)
                except json.JSONDecodeError as e:
                    print(f"ข้อผิดพลาดในการแปลง JSON: {e}")
                    await websocket.send_json({"error": "Invalid JSON format"})
                    continue

                image_b64 = data.get("image", "")
                model_type = data.get("model", "SL")

                # ตรวจสอบความถูกต้องของข้อมูล
                if not image_b64:
                    print("ไม่มีข้อมูลภาพ")
                    await websocket.send_json({"error": "No image data provided"})
                    continue
                if model_type not in ["SL", "TH"]:
                    print(f"ประเภทโมเดลไม่ถูกต้อง: {model_type}")
                    await websocket.send_json({"error": f"Invalid model type: {model_type}"})
                    continue

                # แปลง base64 เป็นภาพ
                if "," in image_b64:
                    image_b64 = image_b64.split(",")[1]
                try:
                    image_data = base64.b64decode(image_b64)
                    image = Image.open(io.BytesIO(image_data)).convert("RGB")
                    # ลดขนาดภาพลงเพื่อเพิ่มความเร็วในการทำนาย
                    image = image.resize((320, 320))
                except Exception as e:
                    print(f"ข้อผิดพลาดในการแปลงภาพ: {e}")
                    await websocket.send_json({"error": f"Failed to decode image: {str(e)}"})
                    continue

                # เลือกโมเดลและทำนาย
                try:
                    if model_type == "TH":
                        results = model_TH.predict(image, imgsz=320, conf=0.3, max_det=1, verbose=False)
                        class_names = model_TH.names
                    else:
                        results = model_SL.predict(image, imgsz=320, conf=0.3, max_det=1, verbose=False)
                        class_names = model_SL.names
                except Exception as e:
                    print(f"ข้อผิดพลาดในการทำนาย: {e}")
                    await websocket.send_json({"error": f"Prediction failed: {str(e)}"})
                    continue

                # สร้างรายการผลลัพธ์
                pred_list = []
                for box in results[0].boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    bbox = list(map(float, box.xyxy[0]))
                    pred_list.append({
                        "label": class_names[cls_id],
                        "confidence": conf,
                        "bbox": bbox
                    })

                # Log ผลลัพธ์
                print(f"Model: {model_type}, Detected {len(pred_list)} boxes: {[pred['label'] for pred in pred_list]}")

                # ส่งผลลัพธ์กลับ
                await websocket.send_json(pred_list)
            except WebSocketDisconnect:
                print("WebSocket ถูกตัดการเชื่อมต่อโดย client")
                break
            except Exception as e:
                print(f"ข้อผิดพลาดในการประมวลผลข้อมูล WebSocket: {e}")
                await websocket.send_json({"error": str(e)})
    except Exception as e:
        print(f"ข้อผิดพลาด WebSocket: {e}")
    finally:
        print("ปิดการเชื่อมต่อ WebSocket")
        if websocket.application_state != WebSocketState.DISCONNECTED:
            await websocket.close()
        gc.collect()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
