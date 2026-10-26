# 이건희 포트폴리오 사이트

- 사이트: `content/` 폴더의 내용을 `build.js`가 읽어서 `dist/`에 페이지를 만들어요. Vercel이 배포할 때마다 자동으로 실행돼요.
- 관리 화면: `내사이트주소/admin` → GitHub로 로그인 → 글쓰기·수정·이미지/영상 업로드.
  저장하면 GitHub에 반영되고, Vercel이 1~2분 안에 자동으로 다시 배포해요.

---

## 처음 한 번만 하는 설정 (약 15분)

### 1. GitHub에 올리기
1. github.com에서 **New repository** → 이름 `geonhee-portfolio` → Private 또는 Public 아무거나 → Create.
2. 저장소 화면의 **uploading an existing file**을 눌러 이 폴더 안의 파일과 폴더를 모두 끌어다 놓고 **Commit changes**.
   (`node_modules`, `dist` 폴더는 없어도 돼요.)

### 2. Vercel에 연결
1. vercel.com → **Add New → Project** → 방금 만든 저장소 **Import**.
2. 설정은 건드리지 말고 **Deploy**. (`vercel.json`에 빌드 방법이 들어 있어요.)
3. 배포가 끝나면 주소(예: `geonhee-portfolio.vercel.app`)를 복사해 두세요.
   주소를 바꾸고 싶으면 Settings → Domains에서 먼저 바꾸고, 바뀐 주소를 아래에 쓰세요.

### 3. `admin/config.yml` 두 줄 고치기
GitHub에서 `admin/config.yml`을 열고 연필(✏️) 버튼으로 수정:
```yaml
repo: 내GitHub아이디/geonhee-portfolio
base_url: https://내사이트주소.vercel.app
```
`site_url`, `display_url`도 같은 주소로 바꾸고 **Commit changes**.

### 4. GitHub 로그인 앱 만들기
1. GitHub → 오른쪽 위 프로필 → **Settings → Developer settings → OAuth Apps → New OAuth App**
2. 입력:
   - Application name: `포트폴리오 관리`
   - Homepage URL: `https://내사이트주소.vercel.app`
   - Authorization callback URL: `https://내사이트주소.vercel.app/api/callback`
3. **Register application** → **Client ID** 복사 → **Generate a new client secret** → Secret 복사.

### 5. Vercel에 비밀값 넣기
Vercel 프로젝트 → **Settings → Environment Variables**:
- `GITHUB_CLIENT_ID` = 복사한 Client ID
- `GITHUB_CLIENT_SECRET` = 복사한 Secret

저장 후 **Deployments → 맨 위 배포 ⋯ → Redeploy**.

### 6. 들어가 보기
`https://내사이트주소.vercel.app/admin` → **GitHub로 로그인** → 끝!

> 나중에 내 도메인(예: geonhee.kr)을 연결하면, 3단계 주소와 4단계 OAuth 앱의 두 주소도 새 도메인으로 바꿔 주세요.

---

## 관리 화면에서 할 수 있는 것

| 메뉴 | 내용 |
|---|---|
| 블로그 글 | 새 글 쓰기. **초안**을 체크하면 사이트에 안 보여요. 본문의 `+` 버튼으로 이미지, **영상(mp4)**, **사진 나란히** 블록 추가 |
| 케이스 스터디 | 케이스 추가·수정, 순서, 결과 숫자, 작업 자료 이미지, **소재 영상 (mp4 업로드 또는 YouTube 링크)** |
| 일을 하며 생긴 이야기 | 이야기 카드 추가·수정. **사진 나란히** 블록으로 노션처럼 사진을 옆으로 배치 |
| 사이트 기본 정보 | 첫 화면 문구·성과 숫자, 경력·학력, 성장 모델, 실험 원칙, AI·자동화 카드, 스킬, 연락처 |

## 영상 업로드 팁
- GitHub는 파일 하나당 **100MB까지**만 받아요. 광고 소재는 **50MB 이하**로 줄여서 올리는 걸 추천해요.
- 줄이는 방법: HandBrake(무료) → Preset `Fast 1080p30` (세로 영상이면 `Fast 720p30`도 충분).
- 영상이 많아지면 저장소가 무거워지니, 아주 긴 영상은 YouTube 링크로 넣는 게 좋아요.

## 폴더 구조
```
content/site.json      메인 페이지 문구 (관리 화면 '사이트 기본 정보')
content/cases/*.md     케이스 스터디
content/stories/*.md   일을 하며 생긴 이야기
content/posts/*.md     블로그 글
static/img, static/uploads   이미지·영상 (관리 화면에서 올린 파일은 uploads에 저장)
assets/site.css, site.js     디자인과 동작
admin/                 관리 화면 설정
api/                   GitHub 로그인 처리 (Vercel 서버 함수)
build.js               페이지 생성기
```

## 내 컴퓨터에서 미리 보기 (선택)
Node.js가 설치되어 있다면:
```
npm install
npm run dev        # http://localhost:3000 에서 사이트 확인
```
