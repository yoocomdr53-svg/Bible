// src/version.ts
// Single source of truth for SuperBible app name and incremental versioning

export const APP_NAME = 'SuperBible';
export const APP_VERSION = 'Ver 1.6';
export const APP_BUILD_DATE = '2026.11.10';
export const APP_FULL_TITLE = `${APP_NAME} ${APP_VERSION}`;
export const APP_SUBTITLE = '스마트 성경 통독 & 말씀 낭독 녹음 시스템';

export interface AppReleaseInfo {
  version: string;
  name: string;
  releaseDate: string;
  changes: string[];
}

export const APP_RELEASE_HISTORY: AppReleaseInfo[] = [
  {
    version: 'Ver 1.6',
    name: 'SuperBible',
    releaseDate: '2026.11.10',
    changes: [
      '성경 본문 다중 역본 실시간 연동 엔진 탑재 (호세아, 학개, 스바냐 등 전 66권 1,189장 실제 본문 정상 표출)',
      '개역개정(GAE), 개역한글(HAN), 쉬운성경(EASY), 표준새번역(SAE), 새번역(SAENEW), 킹제임스(KJV), NIV 공식 지원',
      '킹제임스 흠정역, 직역성경 등 사용자 소장 성경 텍스트(.txt) 간편 등록 모달 및 IndexedDB 고속 오프라인 캐시 구축',
      '성경 본문 더미 반복 문구 버그 완전 해결 및 장·절 실시간 자동 패치',
    ],
  },
  {
    version: 'Ver 1.5',
    name: 'SuperBible',
    releaseDate: '2026.11.10',
    changes: [
      '낭독 진도 관리 및 상세진도 모달 [통독 회차] 표시 기준 수정 (성경 66권 전체 1,189장 완독 시에만 1독으로 표시, 미완독 시 0독 / 12독 정확 표시)',
      '회원 관리 명부, 회원_낭독진도 카드 및 CSV / 구글 스프레드시트 내 통독 회차 0-State 데이터 정규화',
      '신규 가입자 및 1독 미만 회원의 통독 회차 1독 오표기 버그 완전 해결',
    ],
  },
  {
    version: 'Ver 1.4',
    name: 'SuperBible',
    releaseDate: '2026.11.10',
    changes: [
      '부서별 통독 참여 현황 산정 기준 전면 개편: 1인당 평균 분모 제거 및 부서 공동체 성경 66권 전체 1,189장 완독 목표 적용',
      '경영팀, 지벳팀, 중고등부, 초등부, 다이나믹팀 전체 구성원의 합산 낭독 장수와 부서 통독 완독률(%) 실시간 동적 연동',
      '부서별 통독 참여 인원수 및 총 완독 장수(총 O장 / 1,189장) 직관적 시각화 표시',
    ],
  },
  {
    version: 'Ver 1.3',
    name: 'SuperBible',
    releaseDate: '2026.11.10',
    changes: [
      '소속 부서 5개 공식 부서(다이나믹팀, 경영팀, 지벳팀, 중고등부, 초등부) 개편 및 간편 회원가입 시 부서 선택 추가',
      '관리자 성경관리 [부서별 통독 참여 현황] 막대그래프 더미 데이터 초기화 및 실제 사용자 데이터 기반 실시간 집계 연동',
      '신규 가입자 등록 시 이전 로그인 사용자/관리자 통독 데이터 상속 및 누수 버그 원천 차단 (계정별 완벽 격리)',
      '신규 회원 가입 후 직접 낭독하기 전까지 모든 통독 장수 및 녹음 건수 0건으로 정확히 초기화',
      '구글 스프레드시트(yoocomdr57@gmail.com) 신규 가입자 명부 및 실시간 낭독 데이터 양방향 자동 연동',
    ],
  },
  {
    version: 'Ver 1.2',
    name: 'SuperBible',
    releaseDate: '2026.11.10',
    changes: [
      '성경 낭독 녹음 공유 메시지 양식 간소화 (낭독본문, 녹음시간, 제출일시 3항목만 텍스트 전송)',
      '불필요한 수퍼바이블 바로가기 링크 및 교직원 통합 로그인 등 부가 설명문 전면 제거',
      '텔레그램, 카카오톡 및 스마트폰 전체 앱 공유 시 고음질 MP3 음원 파일 동시 업로드/전송 유지',
    ],
  },
  {
    version: 'Ver 1.1',
    name: 'SuperBible',
    releaseDate: '2026.11.10',
    changes: [
      '컴퓨터(PC) 데스크톱 설치 PWA 및 스마트폰 실시간 자동 업데이트(Auto-Update) 시스템 구축',
      '버전 감지 엔드포인트(/version.json) 및 서비스 워커 무효화 캐시 정책(vercel.json) 적용으로 PC 설치 앱 지연 문제 원천 해결',
      '설정 화면에 [PC 및 모바일 자동 업데이트] 상태 카드 및 [최신 버전 확인 및 지금 새로고침] 원클릭 버튼 추가',
    ],
  },
  {
    version: 'Ver 1.0',
    name: 'SuperBible',
    releaseDate: '2026.11.10',
    changes: [
      '로그인 화면 상단 설정(톱니바퀴) 클릭 시 관리자 보안 인증 팝업 연동',
      '관리자 계정(Admin)으로 인증 완료 시에만 설정 화면으로 직행하도록 보안 강화',
      '설정 화면 접속 시 홈 화면이 아닌 시스템 및 계정 설정 화면(SettingsView)이 바로 열리도록 라우팅 수정',
    ],
  },
  {
    version: 'Ver 0.9',
    name: 'SuperBible',
    releaseDate: '2026.11.10',
    changes: [
      '상단 헤더 버전 번호를 SuperBible 제목 바로 밑으로 세로 배치 (모바일 가독성 최적화)',
      '오늘의 말씀 섹션에서 [💌 말씀카드] 버튼 삭제 및 헤더 UI 간소화',
    ],
  },
  {
    version: 'Ver 0.8',
    name: 'SuperBible',
    releaseDate: '2026.11.10',
    changes: [
      '로그인 세션 연속 유지 복원 (나가기 버튼을 누르지 않은 경우 앱 재실행 시 로그인 상태 계속 유지)',
      '나가기(로그아웃) 버튼을 명시적으로 눌렀을 때만 세션 해제 및 로그인 화면 진입',
      '상단 헤더, 홈 하단 프로필 카드, 설정 화면 나가기 버튼에 확인 대화상자 추가',
    ],
  },
  {
    version: 'Ver 0.7',
    name: 'SuperBible',
    releaseDate: '2026.11.10',
    changes: [
      '로그인 화면 상단 헤더의 중복 앱 설치 버튼 삭제',
      '로그인 화면의 스마트폰·태블릿 앱 설치 버튼 1회 설치 시 자동 숨김 처리',
      '홈 화면 상단 헤더의 앱 설치 버튼 삭제',
      '홈 화면의 스마트폰앱설치, 관리자 성경관리, 로고스 관리자 메뉴를 맨 아래쪽으로 이동하여 성경통독 및 통계 가시성 극대화',
    ],
  },
  {
    version: 'Ver 0.6',
    name: 'SuperBible',
    releaseDate: '2026.11.10',
    changes: [
      '앱 종료/재실행 시 자동 우회 방지 및 첫 로그인 화면 필수 진입 보안 강화',
      '첫 로그인 화면에 스마트폰·태블릿 앱 설치(APK / 바로가기) 전용 버튼 전면 배치',
      '홈 화면 통계 메뉴 상단에 전용 앱 설치 안내 배너 추가하여 편리한 설치 지원',
    ],
  },
  {
    version: 'Ver 0.5',
    name: 'SuperBible',
    releaseDate: '2026.11.10',
    changes: [
      '홈 화면 중앙의 중복 5개 메뉴(성경·찬송가·도전일독·낭독녹음·통계) 삭제 및 동선 일원화',
      '홈 첫 화면 중앙에 통계자료 전체 화면(신약/구약 진행률, 주간/월간 분석, 일일 통독, 낭독 녹음 보관함) 전면 배치',
      '하단 내비게이션 바 및 빠른 음성 녹음 플로팅 버튼과의 완벽한 사용자 인터페이스 통합',
    ],
  },
  {
    version: 'Ver 0.4',
    name: 'SuperBible',
    releaseDate: '2026.11.10',
    changes: [
      '성경 낭독 녹음 시 낭독 성경 책·장·절 성경관리 데이터 자동 등록 (이중 등록 완전 제거)',
      '낭독 녹음 진행 시 절(Verse) 단위 실시간 완독 체크 및 영구 동기화',
      '관리자 성경관리(회원_낭독진도 명부 & 구글 시트) 실시간 자동 진도 반영',
      '성경 낭독 완료 즉시 전체 장·절 완독 및 통독 진행률 자동 반영',
    ],
  },
  {
    version: 'Ver 0.3',
    name: 'SuperBible',
    releaseDate: '2026.11.10',
    changes: [
      '앱 명칭 공식 변경: SuperBible (수퍼바이블)',
      '프로그램 버전 표시 시스템 도입 (Ver 0.3)',
      '고화질 스마트폰/태블릿 공식 앱 아이콘 탑재',
      '스마트폰/태블릿 앱 설치(APK / PWA) 지원',
      '낭독 녹음 보관함 다중 선택 및 일괄 삭제 기능',
      '낭독 음원 검수 실제 고음질 MP3 스트리밍 재생 지원',
      '128kbps 방송급 MP3 인코딩 및 음성 피크 자동 정규화',
    ],
  },
  {
    version: 'Ver 0.2',
    name: '수퍼바이블',
    releaseDate: '2026.11.09',
    changes: [
      '신약/구약 통독 분석 및 주간/월간 활동량 통계 개편',
      'Google Drive 사용자별 성경낭독녹음 폴더 자동 동기화',
      '텔레그램 과제제출방 음원 직접 공유 지원',
    ],
  },
  {
    version: 'Ver 0.1',
    name: '수퍼바이블',
    releaseDate: '2026.11.08',
    changes: [
      '초간단 회원가입 및 관리자 통합 명부 연동',
      '실시간 성경 낭독 녹음 및 진도 관리',
    ],
  },
];
