# GitHub 업로드 방법

## 방법 1: Replit 다운로드 (추천)
1. Replit 파일 브라우저에서 왼쪽 사이드바 파일 목록 확인
2. 우클릭 → "Download" 또는 파일 선택 후 다운로드
3. 필요한 폴더들을 개별 다운로드:
   - `client/` 폴더
   - `server/` 폴더  
   - `shared/` 폴더
   - 루트 파일들 (`package.json`, `README.md` 등)

## 방법 2: GitHub 웹 업로드
1. https://github.com/gpdavidyang/PO_Management_Ikjin 접속
2. "uploading an existing file" 클릭
3. 다운로드한 파일들을 드래그 앤 드롭
4. Commit message 입력 후 "Commit changes"

## 방법 3: Git Clone 방식 (가장 깔끔함)
GitHub Desktop이나 로컬 Git을 사용:
```bash
git clone https://github.com/gpdavidyang/PO_Management_Ikjin.git
# 다운로드한 파일들을 클론된 폴더에 복사
git add .
git commit -m "Initial commit"
git push origin main
```

## 업로드 후 브랜치 생성
1. GitHub 저장소에서 "main" 드롭다운 클릭
2. "production" 입력 → "Create branch: production from main"
3. "development" 입력 → "Create branch: development from main"