# 환경 분리 가이드 (Feature Flag 기반)

Git 브랜치 제한으로 인해 **Feature Flag 기반 환경 분리**를 구현했습니다.

## 환경 구분

### Production 환경 (검수팀용)
```bash
# 환경 변수 설정
VITE_ENVIRONMENT=production
VITE_ENABLE_EXCEL_UPLOAD=false
```
- **목적**: 검수팀 전용 안정 버전
- **기능**: 기존 안정된 기능만 활성화
- **Excel 업로드**: 비활성화 (숨김 처리)
- **새로운 기능**: 모두 비활성화

### Development 환경 (개발팀용)
```bash
# 환경 변수 설정  
VITE_ENVIRONMENT=development
VITE_ENABLE_EXCEL_UPLOAD=true
VITE_ENABLE_HANDSONTABLE=true
VITE_ENABLE_APPROVAL=true
```
- **목적**: 신규 기능 개발 및 테스트
- **기능**: 모든 실험적 기능 활성화
- **Excel 업로드**: 활성화
- **새로운 기능**: 개발 진행에 따라 순차 활성화

## 배포 설정 방법

### 검수팀용 배포 (Production)
1. Replit Secrets에서 환경 변수 설정:
   - `VITE_ENVIRONMENT` = `production`
   - `VITE_ENABLE_EXCEL_UPLOAD` = `false`
2. 배포 실행
3. 검수팀에게 URL 제공

### 개발팀용 배포 (Development)  
1. 새로운 Repl 생성 또는 별도 프로젝트 설정
2. 환경 변수 설정:
   - `VITE_ENVIRONMENT` = `development` 
   - `VITE_ENABLE_EXCEL_UPLOAD` = `true`
3. 개발용 배포 URL 생성

## 기능 제어 방식

```typescript
// 각 기능별 플래그 확인
import { isFeatureEnabled } from '@/lib/feature-flags';

// Excel 업로드 기능 표시 여부
const showExcelUpload = isFeatureEnabled('EXCEL_UPLOAD');

// 환경별 자동 설정
const features = getEnvironmentFeatures();
```

## 장점
- ✅ **즉시 적용**: Git 제한 없이 바로 환경 분리
- ✅ **동적 제어**: 환경 변수로 실시간 기능 ON/OFF
- ✅ **안전한 배포**: Production 환경에 실험적 기능 노출 방지
- ✅ **병렬 개발**: 검수와 개발 완전 분리

## 현재 상태
- ✅ Feature Flag 시스템 구축 완료
- ✅ Excel 업로드 기능 환경별 제어 적용
- 🔄 환경 변수 설정 후 배포 준비 완료