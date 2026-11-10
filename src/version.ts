// src/version.ts
// Single source of truth for SuperBible app name and incremental versioning

export const APP_NAME = 'SuperBible';
export const APP_VERSION = 'Ver 0.3';
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
