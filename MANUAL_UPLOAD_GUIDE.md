# 수동 GitHub 업로드 가이드

## 프로젝트 파일 준비 완료
✅ `project-complete.tar.gz` 파일 생성됨
✅ node_modules, .git 폴더 제외
✅ 모든 프로젝트 파일 포함

## 업로드 절차

### 1. 파일 다운로드
1. Replit Files 탭에서 `project-complete.tar.gz` 파일 찾기
2. 우클릭 → "Download" 선택
3. 로컬 컴퓨터에 저장

### 2. 파일 압축 해제
- Windows: 압축 해제 프로그램 사용
- Mac/Linux: `tar -xzf project-complete.tar.gz`

### 3. GitHub 업로드
1. https://github.com/gpdavidyang/POManagementSystem 접속
2. "Add file" → "Upload files" 클릭
3. 압축 해제된 **모든 폴더와 파일**을 드래그앤드롭
4. Commit message: "Complete project upload"
5. "Commit changes" 클릭

### 4. 브랜치 생성
GitHub에서:
1. Branch dropdown → "production" 입력 → "Create branch"
2. Branch dropdown → "development" 입력 → "Create branch"

## 완료 후 즉시 사용
Production Repl 생성 링크:
https://replit.com/new/github/gpdavidyang/POManagementSystem?branch=production