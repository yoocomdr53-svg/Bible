// src/version.ts
// Single source of truth for SuperBible app name and incremental versioning

export const APP_NAME = 'SuperBible';
export const APP_VERSION = 'Ver 0.7';
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
