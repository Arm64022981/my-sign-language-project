export const getAllPatients = async () => {
    const response = await fetch('http://127.0.0.1:5000/api/patients');
    if (!response.ok) {
      throw new Error('ไม่สามารถโหลดข้อมูลผู้ป่วยได้');
    }
    return response.json();
  };
  
  export const deletePatient = async (id: number) => {
    const response = await fetch(`http://127.0.0.1:5000/api/patients/${id}`, {
      method: 'DELETE',
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'ลบข้อมูลไม่สำเร็จ');
    }
  };

  