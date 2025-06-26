# GitHub 연동 설정 가이드

## 1. GitHub Personal Access Token 생성
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" 클릭
3. Note: "Replit PO Management"
4. Expiration: 90 days (또는 원하는 기간)
5. Scopes 선택:
   - [x] repo (전체)
   - [x] workflow
6. "Generate token" 클릭
7. 생성된 토큰 복사 (중요: 한 번만 표시됨)

## 2. Replit에서 GitHub 연동
```bash
# 원격 저장소 추가
git remote add origin https://github.com/gpdavidyang/PO_Management_Ikjin.git

# 현재 변경사항 커밋
git add .
git commit -m "Initial commit: Purchase order management system"

# GitHub에 푸시 (토큰 사용)
git push -u origin main
```

## 3. 브랜치 생성 및 관리
```bash
# Production 브랜치 생성 (검수팀용)
git checkout -b production
git push origin production

# Development 브랜치 생성 (개발팀용)  
git checkout -b development
git push origin development
```

## 4. 각 브랜치별 Repl 생성
1. Production 브랜치용 새 Repl:
   - "Import from GitHub" 선택
   - Repository: gpdavidyang/PO_Management_Ikjin
   - Branch: production
   - 환경 변수: VITE_ENVIRONMENT=production

2. Development 브랜치용 Repl:
   - 현재 Repl 유지 또는 새 Repl 생성
   - Branch: development  
   - 환경 변수: VITE_ENVIRONMENT=development

## 5. 작업 흐름
1. 검수팀: Production Repl에서 안정 버전 테스트
2. 개발팀: Development Repl에서 신규 기능 개발
3. 통합: GitHub에서 Pull Request로 병합 관리