# Production Repl 생성 단계별 가이드

## 1단계: Replit에서 새 Repl 생성
1. **Replit 대시보드** 접속
2. **"+ Create Repl"** 또는 **"Import from GitHub"** 클릭
3. **"Import from GitHub"** 선택

## 2단계: GitHub 저장소 연결
- **GitHub URL**: `https://github.com/gpdavidyang/POManagementSystem`
- **Branch**: `production` 선택 (중요!)
- **Repl Name**: `PO-Management-Production`
- **Description**: 구매 발주 관리 시스템 - 검수팀용 운영 환경

## 3단계: 환경 변수 설정 (Secrets 탭)
```
VITE_ENVIRONMENT=production
VITE_ENABLE_EXCEL_UPLOAD=false
VITE_ENABLE_HANDSONTABLE=false
VITE_ENABLE_ADVANCED_FEATURES=false
NODE_ENV=production
```

## 4단계: 데이터베이스 설정
- Production용 별도 PostgreSQL 데이터베이스 생성
- 또는 개발 데이터베이스와 분리하여 사용

## 5단계: 실행 확인
- `npm run dev` 실행
- 사이드바에 빨간색 "PROD" 배지 확인
- Excel 업로드 탭이 숨겨져 있는지 확인

## 결과
✅ **Development Repl**: 개발팀용 (모든 기능)
✅ **Production Repl**: 검수팀용 (안정 기능만)
✅ **완전한 환경 분리** 달성