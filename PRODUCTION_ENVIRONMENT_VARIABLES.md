# Production 환경 변수 설정

Production Repl 생성 후 다음 환경 변수를 Secrets 탭에서 설정하세요:

## 필수 환경 변수

### 환경 설정
```
VITE_ENVIRONMENT=production
```

### 기능 제어
```
VITE_ENABLE_EXCEL_UPLOAD=false
VITE_ENABLE_HANDSONTABLE=false
VITE_ENABLE_ADVANCED_FEATURES=false
```

### Node.js 환경
```
NODE_ENV=production
```

### 세션 보안 (새로 생성)
```
SESSION_SECRET=<새로운 랜덤 문자열>
```

### 데이터베이스 (선택사항)
```
DATABASE_URL=<Production Database URL>
```
*또는 Replit의 자동 PostgreSQL 사용*

## 설정 후 확인사항
1. 사이드바에 빨간색 "PROD" 배지 표시
2. 발주서 작성 페이지에서 Excel 업로드 탭 숨김
3. 모든 안정 기능 정상 작동

## 개발/운영 환경 차이
| 기능 | Development | Production |
|------|-------------|------------|
| Excel 업로드 | ✅ 활성화 | ❌ 비활성화 |
| 실험적 기능 | ✅ 모든 기능 | ❌ 안정 기능만 |
| 환경 표시 | 파란색 DEV | 빨간색 PROD |