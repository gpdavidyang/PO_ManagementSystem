# 브랜치별 환경 구성 완료

## GitHub 저장소
- Repository: https://github.com/gpdavidyang/POManagementSystem
- 브랜치: main, production, development

## Development 환경 (현재 Repl)
✅ 환경 변수 설정 완료
```
VITE_ENVIRONMENT=development
VITE_ENABLE_EXCEL_UPLOAD=true
```

✅ 기능:
- Excel 업로드 활성화
- 모든 실험적 기능 사용 가능
- 환경 표시기: 파란색 "DEV" 배지

✅ 데이터베이스: PostgreSQL (현재 활성화)

## Production 환경 (별도 생성 필요)
📋 생성 방법:
1. Replit에서 "Import from GitHub" 
2. Repository: gpdavidyang/POManagementSystem
3. Branch: production
4. 환경 변수 설정:
   - VITE_ENVIRONMENT=production
   - VITE_ENABLE_EXCEL_UPLOAD=false

📋 기능:
- Excel 업로드 비활성화
- 안정된 기능만 제공
- 환경 표시기: 빨간색 "PROD" 배지

## Feature Flag 시스템
- 환경별 자동 기능 제어
- 사이드바에 환경 표시
- 개발/운영 환경 완전 분리