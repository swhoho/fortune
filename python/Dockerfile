# Python 3.11 슬림 버전 사용 (가볍고 빠름)
FROM python:3.11-slim

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 의존성 설치
# fonts-nanum: 명반 이미지 생성 시 한글 폰트 깨짐 방지
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-nanum \
    && rm -rf /var/lib/apt/lists/*

# 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

# Railway에서 제공하는 PORT 환경변수 사용 (기본값 8000)
ENV PORT=8000

# 서버 실행
# host 0.0.0.0: 외부 접속 허용
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
