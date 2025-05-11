export const getAllPatients = async () => {
  const response = await fetch('http://127.0.0.1:5000/api/patients');
  if (!response.ok) {
    throw new Error('ไม่สามารถโหลดข้อมูลผู้ป่วยได้');
  }
  const data = await response.json();
  return data.map((patient: any) => ({
    id: patient.id,
    id_card: patient.id_card || '', // เพิ่ม id_card
    name: patient.name,
    gender: patient.gender,
    age: patient.age,
    height: patient.height ? parseFloat(patient.height) : 0,
    weight: patient.weight ? parseFloat(patient.weight) : 0,
    nationality: patient.nationality || 'ไม่ระบุ',
  }));
};

export const deletePatient = async (id_card: string) => {
  const response = await fetch(`http://127.0.0.1:5000/api/patients/${id_card}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'ลบข้อมูลไม่สำเร็จ');
  }
};