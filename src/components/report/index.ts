/**
 * 리포트 컴포넌트 모듈
 * Task 12-16: Phase 3 리포트 UI
 */

// Task 12: 사주 명식 섹션
export { ProfileInfoHeader } from './ProfileInfoHeader';
export { SajuTable } from './SajuTable';
export { DaewunHorizontalScroll } from './DaewunHorizontalScroll';

// 대운 상세 분석 섹션
export { FavorableBar } from './FavorableBar';
export { DaewunDetailSection } from './DaewunDetailSection';

// Task 13: 성격 분석 섹션
export { WillpowerGauge } from './WillpowerGauge';
export { PersonalityCard } from './PersonalityCard';
export { PersonalitySection } from './PersonalitySection';

// Task 14: 사주 특성 섹션
export { CharacteristicsSection } from './CharacteristicsSection';

// Task 15: 특성 그래프
export { TraitBar } from './TraitBar';
export { TraitGraph } from './TraitGraph';
export type { TraitItem } from './TraitGraph';

// Task 16: 적성/재능 섹션
export { KeywordBadge } from './KeywordBadge';
export { ContentCard } from './ContentCard';
export { AptitudeSection } from './AptitudeSection';
export type { ContentCardData, AptitudeSectionData } from './AptitudeSection';

// Task 17: 업무/적성 그래프 섹션
export { WorkAptitudeSection } from './WorkAptitudeSection';
export type { WorkAbilityData, AptitudeTraitsData } from './WorkAptitudeSection';

// Task 18: 재물운 섹션
export { WealthSection } from './WealthSection';
export type { WealthSectionData } from './WealthSection';

// Task 19: 연애/결혼 섹션
export { RomanceSection } from './RomanceSection';
export type { RomanceTraitsData, RomanceSectionData } from './RomanceSection';

// Task 20: 리포트 레이아웃
export { ReportNavigation } from './ReportNavigation';

// 타입 re-export
export type {
  ReportProfileInfo,
  WillpowerData,
  PersonalityCardData,
  PersonalitySectionData,
  CharacteristicsSectionData,
  ReportDaewunItem,
} from '@/types/report';
