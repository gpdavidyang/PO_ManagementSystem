# 브랜치별 환경 구성 가이드

## 환경 분리 전략

### Production 환경 (검수팀용)
**Repl 이름**: PO-Management-Production
**브랜치**: production
**환경 변수**:
```
VITE_ENVIRONMENT=production
VITE_ENABLE_EXCEL_UPLOAD=false
DATABASE_URL=<Production DB URL>
```

**비활성화 기능**:
- Excel 업로드 탭 숨김
- 실험적 기능 비활성화
- 안정된 기능만 제공

### Development 환경 (개발팀용)
**Repl 이름**: PO-Management-Development (현재 Repl)
**브랜치**: development
**환경 변수**:
```
VITE_ENVIRONMENT=development
VITE_ENABLE_EXCEL_UPLOAD=true
DATABASE_URL=<Development DB URL>
```

**활성화 기능**:
- 모든 Excel 업로드 기능
- 새로운 실험적 기능
- 개발/테스트 모드

## 구성 단계

### 1단계: 현재 Repl을 Development로 설정
### 2단계: Production Repl 별도 생성
### 3단계: 각 환경별 데이터베이스 분리
### 4단계: Feature Flag 시스템 검증