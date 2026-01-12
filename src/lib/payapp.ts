/**
 * PayApp 결제 설정
 * - 신용카드1 결제 (PayApp)
 * - REST API: https://api.payapp.kr/oapi/apiLoad.html
 * - JS SDK: https://lite.payapp.kr/public/api/v2/payapp-lite.js
 */

/**
 * PayApp 설정
 */
export const PAYAPP_CONFIG = {
  apiUrl: 'https://api.payapp.kr/oapi/apiLoad.html',
  sdkUrl: 'https://lite.payapp.kr/public/api/v2/payapp-lite.js',
  userId: process.env.PAYAPP_USER_ID || '',
  linkKey: process.env.PAYAPP_LINK_KEY || '',
  linkVal: process.env.PAYAPP_LINK_VAL || '',
  shopName: "Master's Insight AI",
};

/**
 * 결제 요청 파라미터 타입
 */
export interface PayAppPaymentRequest {
  cmd: 'payrequest';
  userid: string;
  shopname: string;
  goodname: string;
  price: number;
  recvphone: string;
  feedbackurl: string;
  returnurl?: string;
  var1?: string; // 커스텀 변수 (userId)
  var2?: string; // 커스텀 변수 (packageId)
  smsuse?: 'n'; // SMS 발송 안함 (웹 결제이므로)
  reqaddr?: 'n'; // 배송지 입력 안함
  memo?: string;
}

/**
 * 결제 응답 타입
 */
export interface PayAppPaymentResponse {
  state: '1' | '0';
  mul_no?: string; // 결제번호
  payurl?: string; // 결제 URL
  errorMessage?: string;
  errno?: string;
}

/**
 * Feedback (결제 완료 콜백) 파라미터 타입
 */
export interface PayAppFeedbackData {
  state: string; // 1: 결제성공, 4: 취소, 8: 에스크로완료
  mul_no: string; // 결제번호
  pay_date: string; // 결제일시
  pay_type: string; // 결제수단 (card, phone, etc.)
  pay_state: string; // 결제상태 (4: 완료)
  goodname: string; // 상품명
  price: string; // 결제금액
  recvphone: string; // 구매자 전화번호
  var1?: string; // 커스텀 변수 (userId)
  var2?: string; // 커스텀 변수 (packageId)
  linkkey: string; // 연동 KEY (검증용)
  linkval: string; // 연동 VALUE (검증용)
}

/**
 * PayApp 결제 요청 생성 (서버 사이드)
 */
export async function createPayAppPayment(params: {
  goodname: string;
  price: number;
  recvphone: string;
  feedbackurl: string;
  returnurl: string;
  userId: string;
  packageId: string;
}): Promise<PayAppPaymentResponse> {
  const formData = new URLSearchParams();
  formData.append('cmd', 'payrequest');
  formData.append('userid', PAYAPP_CONFIG.userId);
  formData.append('linkkey', PAYAPP_CONFIG.linkKey);
  formData.append('linkval', PAYAPP_CONFIG.linkVal);
  formData.append('shopname', PAYAPP_CONFIG.shopName);
  formData.append('goodname', params.goodname);
  formData.append('price', params.price.toString());
  formData.append('recvphone', params.recvphone);
  formData.append('feedbackurl', params.feedbackurl);
  formData.append('returnurl', params.returnurl);
  formData.append('var1', params.userId);
  formData.append('var2', params.packageId);
  formData.append('smsuse', 'n'); // SMS 발송 안함
  formData.append('reqaddr', 'n'); // 배송지 입력 안함

  const response = await fetch(PAYAPP_CONFIG.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const text = await response.text();

  // 응답 파싱 (URL 인코딩된 키=값 형태)
  const result: Record<string, string> = {};
  text.split('&').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key && value) {
      result[key] = decodeURIComponent(value);
    }
  });

  return {
    state: result.state as '1' | '0',
    mul_no: result.mul_no,
    payurl: result.payurl,
    errorMessage: result.errorMessage,
    errno: result.errno,
  };
}

/**
 * PayApp Feedback 검증
 * linkkey와 linkval이 일치하는지 확인
 */
export function verifyPayAppFeedback(data: PayAppFeedbackData): boolean {
  return data.linkkey === PAYAPP_CONFIG.linkKey && data.linkval === PAYAPP_CONFIG.linkVal;
}

/**
 * 결제 ID 생성 (중복 방지용)
 */
export function generatePayAppOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `payapp-${timestamp}-${random}`;
}
