// 사이트에 나오는 글과 주소는 모두 이 파일에 있습니다.
// 포스터, 창 안의 글, 단추 주소, 소개, 연락처를 넣을 때 여기만 고치면 됩니다.

// 포스터 차례: 벽 왼쪽부터 이 배열 순서대로 걸립니다.
// poster  : 포스터 그림 파일(세로 2:3). 파일이 있으면 액자에 걸리고, 없으면 빈 칸으로 남습니다.
// tagline : 목록과 창 제목 아래에 나오는 한 줄. 비워 두면 나오지 않습니다.
// body    : 창 안의 글. 문단마다 문자열 하나. 비워 두면 "내용은 곧 채웁니다." 문구가 나옵니다.
// links   : 창의 단추. 주소를 넣은 것만 단추로 나옵니다. 없는 단추(예: 사이트가 없는 프로젝트)는 줄을 빼면 됩니다.
//
// 노션 주소는 웹에 게시된 공개 주소(notion.site)입니다. notion.so 꼴은 로그인한 사람만 열립니다.
// GitHub 주소는 각 저장소의 origin 입니다.
export const PROJECTS = [
  {
    id: 'infra',
    title: 'RONANLAB INFRA',
    poster: 'posters/poster-infra.png',
    tagline: '',
    body: [
      'GPU가 든 서버 한 대 안에 가상 머신 다섯 대를 띄우고, 그 위에 kubeadm 으로 쿠버네티스 클러스터를 직접 세웠습니다.',
      '공개 서비스 둘(펫퍼민트, 런슈즈)과 ArgoCD, Jenkins, Harbor, Grafana 가 이 클러스터에서 돕니다. 코드를 올리면 빌드에서 배포까지 저장소에 적힌 대로 이어집니다.',
      '바깥 요청은 Cloudflare 터널로만 들어오고, 언어 모델 추론은 클러스터 밖 호스트의 GPU 가 맡습니다.',
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
    tagline: '',
    body: [
      '동시에 도는 Claude Code 세션 여럿을 한 화면에 모아 보고, 그 자리에서 일을 시키는 관제실입니다.',
      '세션마다 코더, 디자이너, 서기, 조사, 관리자 같은 역할을 맡고, 픽셀 오피스 안의 캐릭터로 나타나 지금 무엇을 하는지 보여 줍니다.',
      '세션은 tmux 안에서 돌고, 작업은 git worktree 로 갈라 서로의 파일을 건드리지 않게 했습니다.',
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
    tagline: '',
    body: [
      '보험사 상담원이 고객 전화를 받으면서 반려동물 보험 약관을 물어보는 사내 챗봇입니다.',
      '고객을 고르면 그 고객이 가입한 특약 안에서만 조항을 찾아 답하고, 답에 쓴 근거 조항을 옆에 함께 보여 줍니다.',
      '보험금 계산처럼 규칙으로 정해지는 답은 모델에 맡기지 않고 코드가 냅니다. 언어 모델과 데이터는 모두 사내 서버에 둡니다.',
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
    tagline: '',
    body: [
      '러닝화의 스펙과 리뷰를 한곳에 모은 아카이브 사이트입니다.',
      '스택하이트나 미드솔 같은 낯선 용어마다 풀이가 붙어 있어, 러닝화를 처음 고르는 사람도 표를 읽을 수 있습니다.',
      '신발끼리 나란히 비교하거나 추천을 받을 수 있고, 리뷰와 용어를 찾아 답하는 챗봇에게 물어볼 수도 있습니다.',
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

// 맨 위 메뉴의 소개와 연락처. body 는 문단 배열, items 는 [이름, 보이는 글, 주소] 배열입니다.
// 전화번호는 넣지 않습니다.
export const ABOUT = {
  title: '소개',
  body: [],
};

export const CONTACT = {
  title: '연락처',
  body: [],
  items: [
    // ['메일', 'name@ronanlab.dev', 'mailto:name@ronanlab.dev'],
    // ['GitHub', 'github.com/...', 'https://github.com/...'],
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
