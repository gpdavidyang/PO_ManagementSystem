# Production 환경 수동 구성 가이드

## Git 없이 Production 환경 생성

### 1단계: 새 Repl 생성
1. https://replit.com 접속
2. "Create Repl" 클릭
3. "Node.js" 템플릿 선택
4. Name: "PO-Management-Production"

### 2단계: 프로젝트 파일 복사
현재 Development Repl에서:
1. 전체 프로젝트 선택 (Ctrl+A)
2. 복사 (Ctrl+C)
3. 새 Production Repl에 붙여넣기 (Ctrl+V)

### 3단계: Production 환경 변수 설정
Secrets 탭에서:
```
VITE_ENVIRONMENT=production
VITE_ENABLE_EXCEL_UPLOAD=false
VITE_ENABLE_HANDSONTABLE=false
NODE_ENV=production
```

### 4단계: 종속성 설치 및 실행
```bash
npm install
npm run dev
```

### 5단계: 확인
- 사이드바에 빨간색 "PROD" 배지 표시
- 발주서 작성에서 Excel 업로드 탭 없음
- 안정된 기능만 활성화

## 완료 시 얻는 환경
✅ Development Repl: 개발팀용 (모든 기능)
✅ Production Repl: 검수팀용 (안정 기능만)
✅ 완전한 기능 분리