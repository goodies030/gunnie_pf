---
order: 3
label: Case 03
meta: 헤이링 · 26 Q1–Q2
compact: false
stages: [data, revenue]
title: SQL로 결제자·환불자·고사용자 정의를 다시 세우기
question: 매출이 변했을 때 원인이 광고비인지, 채널 품질인지, 제품 경험인지, 환불인지 분리할 수 있어야 했습니다.
steps:
  - label: 문제
    body: Mixpanel, 광고 대시보드, 운영 어드민에 지표가 흩어져 있어 유저 단위로 연결해 볼 수 없었습니다. 대화 로그나 자기소개 같은 정성 데이터도 바로 볼 수 없었습니다.
  - label: 실행
    body: |
      - **결제자 재정의:** 멤버십 컬럼이 NULL이라 결제자가 0명으로 잡히는 문제를 발견했습니다. INFORMATION_SCHEMA로 테이블을 탐색해 멤버십 생성 이력 기준으로 바꿨습니다.
      - **채널 × 온보딩 연결:** 인입 채널, 영어 레벨, 학습 목표를 결제자 데이터에 조인해 Instagram 유입 결제자 같은 세그먼트를 뽑았습니다.
      - **환불 원인 분석:** 최근 3개월 환불 설문에 유저 정보와 OS를 붙여, 환불이 특정 OS나 통화 경험 문제와 연결되는지 확인했습니다.
  - label: 적용
    body: 결제자 페르소나는 크리에이티브 메시지와 첫 통화 프롬프트에, 고사용자 정의는 CRM 타깃팅에, 통화 횟수별 결제 전환은 퍼널 개선에 반영했습니다.
results_label: What it unlocked
results:
  - { value: "세그먼트 직접 추출", delta: "", text: "예: 여성 20~35세 · 영어 레벨 3~4 · 최근 1개월 결제자" }
  - { value: "채널 품질 판단", delta: "", text: "ROAS·CPI를 넘어 채널별 결제자 구성까지 확인" }
  - { value: "환불 × OS 구조", delta: "", text: "제품 이슈를 OS·사용 맥락별로 분리" }
  - { value: "JOIN · CASE WHEN · DATE_SUB · TIMESTAMPDIFF", delta: "", text: "MySQL (DBeaver)", small: true }
images:
  - { image: /img/p2_0.webp, caption: "SQL 분석 작업 화면", link: "" }
videos: []
details_summary: ""
---
