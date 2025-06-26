# 빠른 GitHub 브랜치 설정 방법

## 1단계: 프로젝트 파일 수동 업로드
1. GitHub 저장소: https://github.com/gpdavidyang/PO_Management_Ikjin
2. "uploading an existing file" 클릭
3. 다음 파일들을 드래그 앤 드롭으로 업로드:
   - `package.json`
   - `README.md` 
   - `client/` 폴더 전체
   - `server/` 폴더 전체
   - `shared/` 폴더 전체
   - `.gitignore`
   - 기타 설정 파일들

## 2단계: GitHub에서 브랜치 생성
1. 업로드 완료 후 저장소 페이지에서
2. 좌상단 "main" 드롭다운 클릭
3. 텍스트 박스에 "production" 입력
4. "Create branch: production from main" 클릭
5. 동일하게 "development" 브랜치도 생성

## 3단계: 각 브랜치별 Repl 생성
1. **Production Repl (검수팀용)**:
   - Replit에서 "Import from GitHub" 선택
   - Repository: gpdavidyang/PO_Management_Ikjin
   - Branch: production
   - Secrets 설정: VITE_ENVIRONMENT=production

2. **Development Repl (개발팀용)**:
   - 현재 Repl 유지
   - Secrets 설정: VITE_ENVIRONMENT=development

## 결과
- 검수팀: Production Repl에서 Excel 업로드 기능 숨김
- 개발팀: Development Repl에서 모든 신규 기능 활성화
- 완전한 환경 분리 달성