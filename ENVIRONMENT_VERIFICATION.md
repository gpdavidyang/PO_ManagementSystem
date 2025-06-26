# 환경별 설정 검증

## 현재 Development 환경 설정
✅ PostgreSQL 데이터베이스 생성 완료
✅ 환경 변수 파일 생성 (.env.development/.env.production)
✅ Feature Flag 시스템 업데이트
✅ 환경 표시기 컴포넌트 추가

## 설정된 환경 변수
```
VITE_ENVIRONMENT=development
VITE_ENABLE_EXCEL_UPLOAD=true
```

## Production 환경 구성 방법
1. GitHub에서 production 브랜치로 새 Repl 생성
2. 환경 변수 설정:
   - VITE_ENVIRONMENT=production
   - VITE_ENABLE_EXCEL_UPLOAD=false
3. 별도 데이터베이스 연결

## 기능 차이
- **Development**: Excel 업로드, 모든 실험적 기능 활성화
- **Production**: 안정된 기능만 제공, Excel 업로드 비활성화

## 환경 표시기
사이드바 헤더에 환경 배지 표시:
- DEV (파란색): 개발 환경
- PROD (빨간색): 운영 환경