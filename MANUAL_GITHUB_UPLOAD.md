# GitHub 수동 업로드 완료 가이드

## Replit Git 제한사항 우회 방법

### 1단계: 프로젝트 파일 준비
핵심 파일들만 선별하여 업로드:

**필수 파일:**
- `package.json`, `package-lock.json`
- `README.md`
- `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`
- `drizzle.config.ts`, `components.json`

**핵심 폴더:**
- `client/` - React 프론트엔드
- `server/` - Express 백엔드  
- `shared/` - 공통 스키마/타입
- `migrations/` - 데이터베이스 마이그레이션

### 2단계: GitHub 저장소 생성
1. https://github.com/new 접속
2. Repository name: `POManagementSystem`
3. Description: `구매 발주 관리 시스템 - React + Express + PostgreSQL`
4. Public 선택
5. "Create repository" 클릭

### 3단계: 파일 업로드
1. "uploading an existing file" 클릭
2. 폴더별로 드래그 앤 드롭 업로드
3. Commit message: "Initial commit: Complete PO Management System"

### 4단계: 브랜치 생성
1. "main" 드롭다운 클릭
2. "production" 입력 → "Create branch"
3. "development" 입력 → "Create branch"

### 5단계: 환경 분리
- Production 브랜치: 검수팀용 안정 버전
- Development 브랜치: 개발팀용 신규 기능