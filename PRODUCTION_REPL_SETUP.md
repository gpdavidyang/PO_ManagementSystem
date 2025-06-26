# Production Repl 설정 가이드

## 1단계: 새 Repl 생성
1. Replit 대시보드에서 "Import from GitHub" 클릭
2. Repository: `gpdavidyang/POManagementSystem`
3. Branch: `production` 선택
4. Repl name: `PO-Management-Production`

## 2단계: 환경 변수 설정
Production Repl에서 다음 환경 변수 추가:

### Secrets 탭에서 설정:
```
VITE_ENVIRONMENT=production
VITE_ENABLE_EXCEL_UPLOAD=false
VITE_ENABLE_HANDSONTABLE=false
VITE_ENABLE_ADVANCED_FEATURES=false
DATABASE_URL=<Production Database URL>
SESSION_SECRET=<Production Session Secret>
```

## 3단계: 개발 환경 설정
현재 Repl (Development)에서 환경 변수 설정:

### Secrets 탭에서 설정:
```
VITE_ENVIRONMENT=development
VITE_ENABLE_EXCEL_UPLOAD=true
VITE_ENABLE_HANDSONTABLE=true
VITE_ENABLE_ADVANCED_FEATURES=true
```

## 4단계: 데이터베이스 분리
- Production: 별도 PostgreSQL 데이터베이스 
- Development: 현재 데이터베이스 유지

## 결과
✅ Production: 검수팀용 안정 환경 (Excel 업로드 비활성화)
✅ Development: 개발팀용 전체 기능 환경
✅ 완전한 환경 분리 달성