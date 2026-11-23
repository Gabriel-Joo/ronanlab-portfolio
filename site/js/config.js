// 사이트에 나오는 글과 주소는 모두 이 파일에 있습니다.
// 포스터, 창 안의 글, 단추 주소, 소개, 연락처를 넣을 때 여기만 고치면 됩니다.

// 포스터 차례: 벽 왼쪽부터 이 배열 순서대로 걸립니다.
// poster  : 포스터 그림 파일(세로 2:3). 파일이 있으면 액자에 걸리고, 없으면 빈 칸으로 남습니다.
// tagline : 제목 아래 한 줄(무엇을 하는 프로젝트인지). 목록, 창, 소개 화면에 나옵니다.
// body    : 창 안의 글. 문단마다 문자열 하나. 사람이 검수한 글이니(2026-11-24) 고칠 때는 사실을 확인합니다.
// links   : 창의 단추. 주소를 넣은 것만 단추로 나옵니다. 없는 단추(예: 사이트가 없는 프로젝트)는 줄을 빼면 됩니다.
//
// 노션 주소는 웹에 게시된 공개 주소(notion.site)입니다. notion.so 꼴은 로그인한 사람만 열립니다.
// GitHub 주소는 각 저장소의 origin 입니다.
export const PROJECTS = [
  {
    id: 'infra',
    title: 'RONANLAB INFRA',
    poster: 'posters/poster-infra.png',
    tagline: '쿠버네티스 클러스터 구축과 운영',
    body: [
      '물리 서버 한 대 위에 가상 머신 다섯 대를 올려 kubeadm으로 클러스터를 세우고, 그 위에서 서비스 둘과 운영 도구를 돌립니다.',
      '서비스 공개용 인바운드 포트 0개로 공개 주소 7개를 운영합니다. Cloudflare Tunnel을 클러스터 안의 파드로 띄워 서버가 바깥으로 먼저 연결을 열게 했고, 공유기에서 들어오는 길은 관리용 SSH 하나만 남겨 두었습니다. 워커 넷에 app, app, infra, platform 역할을 고정해 노드 하나가 죽었을 때 무엇이 멈추는지를 노드 이름으로 말할 수 있게 만들었습니다.',
    ],
    links: {
      docs: 'https://odd-leather-401.notion.site/4153218bb52480069acbdd52063fe2c5',
      portfolio: 'https://odd-leather-401.notion.site/4153218bb52480d39869e736a15b4b8f',
      github: 'https://github.com/Gabriel-Joo/ronanlab-infra',
    },
  },
  {
    id: 'foreman',
    title: 'FOREMAN',
    poster: 'posters/poster-foreman.png',
    tagline: 'AI 에이전트 운영 관제실',
    body: [
      '한 서버에서 동시에 도는 여러 Claude Code 세션을 브라우저 한 화면에서 보고, 지시하고, 승인하고, 기록하는 관제 도구입니다.',
      '만든 계기는 재시작 567,740회를 한 달 넘게 몰랐던 일입니다. 실행 파일을 못 찾은 systemd 유닛이 3초마다 다시 뜨고 있었는데, 죽은 것도 응답이 끊긴 것도 아니라 기존 감시 어디에도 걸리지 않았습니다. 그래서 「이것이 막히거나 틀어지면 스스로 알리는가」를 설계 기준으로 삼았습니다. 대화 압축이 지시와 결정의 약 63%를 지운다는 것을 세션 둘로 직접 재고, 그 결과로 인계 방식을 다시 짰습니다.',
    ],
    links: {
      docs: 'https://odd-leather-401.notion.site/40f3218bb52480ec8033dd26aedd17d5',
      portfolio: 'https://odd-leather-401.notion.site/4133218bb524816b832acf6a07f583c7',
      github: 'https://github.com/Gabriel-Joo/foreman',
    },
  },
  {
    id: 'petmint',
    title: 'PETMINT',
    poster: 'posters/poster-petmint.png',
    tagline: '반려동물 보험약관 RAG 챗봇',
    body: [
      '보험사 상담원이 약관 조항을 근거와 함께 찾아볼 수 있게 만든 사내 챗봇입니다. 모델과 데이터 모두 사내 서버에 두고 바깥의 언어 모델 서비스는 한 번도 부르지 않습니다.',
      '검색 품질을 103문항 회귀 세트로 측정합니다. 정답 조항이 있는 97문항 중 상위 다섯 개 안에 정답이 든 것이 88개, 평균 역순위 0.745입니다. 7B 모델이 보험금 계산을 74건 중 26건 틀려, 계산과 부담보 판정은 모델에 넘기기 전에 코드가 먼저 답하도록 뺐습니다.',
    ],
    links: {
      docs: 'https://odd-leather-401.notion.site/3ea3218bb5248091aa0bc1eb58ae9ccb',
      portfolio: 'https://odd-leather-401.notion.site/4133218bb5248142883af1f21788f6ca',
      site: 'https://petmint.ronanlab.dev',
      github: 'https://github.com/Gabriel-Joo/petmint-rag-chatbot',
    },
  },
  {
    id: 'runshoes',
    title: 'RUNSHOES',
    poster: 'posters/poster-runshoes.png',
    tagline: '러닝화 스펙과 리뷰 아카이브',
    body: [
      '러닝화 310켤레의 스펙을 모아, 처음 달리기를 시작한 사람도 자기에게 맞는 신발을 찾을 수 있게 만든 사이트입니다.',
      '모르는 값은 짐작으로 채우지 않고 정보 없음으로 둡니다. 비교 화면도 쿠션 점수나 백분위를 매기지 않았습니다. 가진 값이 공시값뿐이라 점수를 그리면 근거 없는 판정이 되고, 높을수록 좋은 게 아닌 값은 그림이 거짓말을 하기 때문입니다. 리뷰 1,800건은 둘러볼 거리를 위한 시드 데이터이며 문서와 화면에 그 사실을 밝혀 두었습니다.',
    ],
    links: {
      docs: 'https://odd-leather-401.notion.site/3e33218bb52480ffa796c8a04d324a06',
      portfolio: 'https://odd-leather-401.notion.site/4133218bb52481dc803ce2938c011be0',
      site: 'https://runshoes.ronanlab.dev/login',
      github: 'https://github.com/Gabriel-Joo/runshoes',
    },
  },
];

// 창의 단추: 이름과 차례.
export const LINK_LABELS = [
  ['docs', '기술문서'],
  ['portfolio', '포트폴리오'],
  ['site', '사이트 보기'],
  ['github', 'GitHub'],
];

// 맨 위 메뉴의 소개. 위에 자기소개, 아래에 프로젝트 소개(한 줄씩, 누르면 그 포스터 창이 열린다).
// 자기소개 글은 본인이 쓴 그대로다. 고치지 않는다.
export const ABOUT = {
  title: '소개',
  selfTitle: '자기소개',
  body: [
    '안녕하십니까! AI 서비스를 만들고 운영하는 엔지니어를 꿈꾸는 주갑열입니다.',
    '저는 전공도 경력도 개발과는 거리가 멀었습니다. 철학과 경영학을 공부했고, 생협에서 재고와 매장을 관리했고, 제약회사에서 생산 일정을 챙겼습니다.',
    '2022년에 일하면서 들은 개발 부트캠프에서 처음으로 내가 만든 게 돌아가는 걸 봤습니다. 조금 더 제대로 배워 보고 싶어서 2026년에 폴리텍에 들어왔습니다.',
    '늦게 시작한 만큼 기초부터 차근차근 밟았습니다. 수업이 끝나고도 남아서 그날 배운 것을 이해하려고 노력하고, 안 되면 될 때까지 붙잡고 있었습니다.',
    '과제로 끝나는 프로젝트 말고 실제로 돌아가는 것을 만들고 싶었습니다. 서버 한 대에 쿠버네티스를 직접 세우고, 그 위에 챗봇과 리뷰 사이트를 올려 지금도 운영하고 있습니다. 주소를 열면 실제로 떠 있는 서비스입니다.',
    '기능만 만들어 놓고 끝내지 않으려고 했습니다. 모니터링을 붙여 지금 어떤 상태인지 볼 수 있게 하고, 왜 그렇게 만들었는지를 문서로 남기는 데도 시간을 많이 썼습니다. 네 프로젝트 모두 그렇게 정리해 두었습니다.',
  ],
  projectsTitle: '프로젝트 소개',
  projectOrder: ['infra', 'petmint', 'foreman', 'runshoes'], // 이 차례로 한 줄씩. 글은 PROJECTS 의 title 과 tagline
};

// 연락처. items 는 [이름, 보이는 글, 주소]. 전화번호는 넣지 않습니다.
export const CONTACT = {
  title: '연락처',
  body: [],
  items: [
    ['메일', 'cjswoduf@gmail.com', 'mailto:cjswoduf@gmail.com'],
    ['GitHub', 'https://github.com/Gabriel-Joo', 'https://github.com/Gabriel-Joo'],
  ],
};

// 화면 곳곳의 짧은 문구.
export const TEXT = {
  brand: 'RONANLAB',
  introTitle: 'NOW SHOWING',
  introLead: '영화관 로비를 걸어 다니며 프로젝트 네 편을 둘러봅니다.',
  empty: '내용은 곧 채웁니다.',
  linkPending: '준비 중',
  hintOpen: '누르면 열립니다',
  noWebgl: '이 브라우저에서는 3D 로비를 띄울 수 없어 목록으로 보여 드립니다.',
  tooSlow: '기기가 느려 목록 화면으로 바꿨습니다.',
};

// 입간판과 네온 간판의 글.
export const SIGN = {
  heading: 'NOW SHOWING',
  footer: 'RONANLAB.DEV',
};
