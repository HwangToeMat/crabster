FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# 포트 설정 (Cloud Run 환경에 맞춤)
ENV PORT=3000
EXPOSE 3000

# 서버 실행
CMD ["npm", "start"]