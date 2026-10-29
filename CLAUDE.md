# 이건희 포트폴리오 사이트 — 작업 메모

Vercel에 배포되는 정적 포트폴리오 사이트 (gunniepf-nine.vercel.app).
프레임워크 없이 `build.js`가 `content/`를 읽어 `dist/`에 HTML을 만든다. Vercel이 push마다 `npm run build`를 실행한다.

## 페이지
- `/` 그로스 마케터 포트폴리오 (넥스트증권 그로스 직무 기준으로 구성)
- `/video/` 프리랜서 영상 콘텐츠 마케터 포트폴리오 (`content/video.json`)
- `/blog/`, `/blog/<slug>/` 블로그 (`content/posts/*.md`, `draft: true`면 제외)
- `/admin/` Decap CMS 관리 화면 (GitHub OAuth, `api/auth.js`, `api/callback.js`)

## 구조
```
build.js              페이지 생성기 (marked + gray-matter)
assets/site.css       전체 디자인 (아래쪽에 섹션별 덧붙임: mobile, case link, 세부 작업 과정, /video)
assets/site.js        필터, 읽기 다이얼로그(이야기·세부 작업 과정·이미지), 연락처 복사
content/site.json     메인 페이지 문구·성과 카드·경력·모델·원칙·AI 카드·스킬
content/cases/*.md    케이스 (frontmatter: steps, results, images, videos / compact: true면 하단 2단 카드)
content/process/*.md  케이스별 "세부 작업 과정" = 노션 원문 (frontmatter `case`로 케이스 파일과 연결)
content/stories/*.md  "일을 하며 생긴 이야기"
content/video.json    /video 페이지 전체 데이터
static/img            노션에서 가져온 이미지 (webp)
static/uploads/thumbs YouTube 썸네일 (영상 ID.webp)
admin/config.yml      CMS 필드 정의 / admin/cms.js 에디터 블록(사진 나란히, mp4, YouTube 카드)
```

## 마크다운 규칙
- `[[youtube:ID|캡션|v]]` 한 줄 = YouTube 카드 (`v`는 세로 쇼츠). 연속된 줄은 한 줄 그리드로 묶임.
- `<!--row--><div class="cols" ...>...</div><!--/row-->` = 노션식 사진 나란히 배치.
- `<figure class="full"><img ...></figure>` = 긴 장표 이미지(최대 높이 제한 없음).
- `~`는 범위 표기로 쓰도록 취소선 문법을 꺼둠 (build.js의 marked tokenizer del).
- 원칙 카드의 `proof`에 "Case 0X"를 쓰면 자동으로 케이스 링크 버튼이 됨.
- 케이스 id가 숫자로 시작함 (`01-heyring-dap`). CSS/JS 선택자는 `#01...` 대신 `[id="01-..."]`나 getElementById 사용.

## 디자인
- 흰 배경, 연회색 카드(`--tint #F5F6F8`, radius 12px), 그림자 없음. 넥스트증권 채용 페이지 톤 참고.
- 강조색은 블랙 그라디언트(`--grad`). 하이라이트(세이지 마커 `--hl-mark`)는 맨 위 성과 카드 숫자에만.
- 폰트: Pretendard 우선, 웹폰트는 Noto Sans KR.
- 섹션 제목: 회색 영문 eyebrow + 검정 굵은 한글 제목.
- 클릭 가능한 곳은 반드시 버튼/칩 모양(`.case-chip`)으로 보이게 (사용자 피드백).

## 내용 원칙
- 숫자는 본인 노션/이력서에 있는 것만. 성과·후기·영상별 지표를 지어내지 않는다.
- /video의 영상별 성과는 지금 전부 "캠페인 성과"(캠페인 전체 숫자). 영상 단위 지표를 받으면 교체.
- 말투: 짧고 담백한 해요체/합니다체, 과장 수식어 없이.

## 남은 일
- [x] `admin/config.yml`의 `repo`(goodies030/gunnie_pf), `base_url`·`site_url`·`display_url`(실제 도메인) 채우기
- [ ] GitHub OAuth App 생성(callback `/api/callback`) + Vercel 환경변수 `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- [ ] 저장소에 남은 중복 폴더 `geonhee-portfolio/` 삭제
- [ ] /video: 쇼릴을 mp4 자동재생(무음)으로 교체 (파일 받으면 `static/uploads/`)
- [ ] /video: 영상별 CTR·3초 시청률·CPI 받으면 `work.items[].result` 교체
- [ ] /video 문구를 관리 화면에서 고칠 수 있게 `admin/config.yml`에 `content/video.json` 파일 컬렉션 추가
- [ ] Case 02(Web2App), Case 04(콰트)는 세부 작업 과정 문서가 없음 (노션 원문 없음)
- [ ] Case 01 노션 페이지의 데이터베이스(표) 블록은 아직 옮기지 못함

## 확인 방법
```
npm install
node build.js && npx serve dist   # http://localhost:3000, /video/
```
모바일(390px)에서 가로 스크롤이 생기지 않는지 꼭 확인.
