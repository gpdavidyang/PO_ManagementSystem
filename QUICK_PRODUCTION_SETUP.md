# 즉시 Production Repl 생성 방법

## 방법 1: Replit Import (추천)
1. 새 브라우저 탭에서 https://replit.com 접속
2. "+ Create Repl" 클릭
3. "Import from GitHub" 선택
4. URL 입력: `gpdavidyang/POManagementSystem`
5. Branch 선택: `production`
6. Repl name: `PO-Management-Production`

## 방법 2: 직접 링크 사용
https://replit.com/new/github/gpdavidyang/POManagementSystem?branch=production

## Production 환경 변수 설정
Secrets 탭에서 설정:
```
VITE_ENVIRONMENT=production
VITE_ENABLE_EXCEL_UPLOAD=false
```

## 즉시 확인 가능한 차이점
- 사이드바: 빨간색 "PROD" 배지
- 발주서 작성: Excel 업로드 탭 없음
- 안정된 기능만 활성화

두 환경이 동시에 실행되어 개발팀과 검수팀이 독립적으로 작업할 수 있습니다.