import api from "./api";

export interface ReceiptData {
  // AddReceiptPage의 formData와 타입을 일치시킵니다.
  cardholder_name: string;
  approval_date: string;
  actual_amount: string;
  reimbursement_amount: string;
  card_number: string;
  approval_number: string;
  supply_amount: string;
  vat_amount: string;
  merchant_name: string;
  merchant_business_number: string;
  category: string;
  meal_type: string;
  notes: string;
  month: string; // YYYY-MM 형식으로 채워야 함
}

export const createReceipt = async (data: {
  receiptData: ReceiptData;
  imageFile?: File | null;
}) => {
  const { receiptData, imageFile } = data;
  const formData = new FormData();

  // 백엔드가 JSON 문자열을 기대하므로 객체를 문자열로 변환합니다.
  formData.append(
    "receipt_data",
    new Blob([JSON.stringify(receiptData)], { type: "application/json" }),
  );

  if (imageFile) {
    formData.append("file", imageFile);
  }

  const response = await api.post("/receipts/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getReceipts = async () => {
  const response = await api.get("/receipts/");
  return response.data;
};
