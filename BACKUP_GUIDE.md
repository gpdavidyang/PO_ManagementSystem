# 프로젝트 파일 백업 가이드

## 1. 압축 파일 백업 (권장)

### 자동 생성된 백업 파일
✅ `po-system-backup-YYYYMMDD_HHMMSS.tar.gz` 파일 생성됨

### 백업 내용
- 모든 소스 코드 (client/, server/, shared/)
- 설정 파일 (package.json, tsconfig.json, vite.config.ts 등)
- 환경 설정 파일 (.env.development, .env.production)
- 문서 파일 (*.md)
- 제외: node_modules, .git, uploads, 기존 tar.gz 파일

### 다운로드 방법
1. Replit Files 탭에서 백업 파일 찾기
2. 우클릭 → "Download" 선택
3. 로컬 컴퓨터에 저장

## 2. 개별 폴더 백업

### 핵심 폴더별 백업
- `client/` - 프론트엔드 React 코드
- `server/` - 백엔드 Express 코드  
- `shared/` - 공유 타입 및 스키마
- `migrations/` - 데이터베이스 마이그레이션

### 방법
각 폴더를 개별적으로 우클릭 → "Download as zip"

## 3. 코드 저장소 백업

### GitHub 대안
1. GitLab 계정 생성
2. 새 private repository 생성
3. Replit Git integration 시도

### 로컬 Git 저장소
```bash
# 새로운 Git 저장소 초기화 (문제 발생 시)
rm -rf .git
git init
git add .
git commit -m "Complete backup"
```

## 4. 클라우드 저장소 백업
- Google Drive에 tar.gz 파일 업로드
- Dropbox, OneDrive 등 활용
- 여러 위치에 중복 저장 권장

## 5. 정기 백업 권장사항
- 주요 기능 개발 완료 시마다 백업
- 일일 백업 (Development 환경)
- 배포 전 반드시 백업

## 복원 방법
1. 새 Repl 생성
2. 백업 파일 업로드 및 압축 해제
3. `npm install` 실행
4. 환경 변수 설정
5. `npm run dev` 실행