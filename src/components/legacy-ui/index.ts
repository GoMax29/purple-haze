// Composants principaux
export { default as Header } from './Header';
export { default as NewHeader } from './NewHeader';
export { default as CitiesButtons } from './CitiesButtons';
export { default as WeatherSummary } from './WeatherSummary';
export { default as NowSection } from './NowSection';
export { default as HourlySection } from './HourlySection';
export { default as HourlySlotsSection } from './HourlySlotsSection';
export { default as WeeklySection } from './WeeklySection';
export { default as ToggleSimpleDetail } from './ToggleSimpleDetail';

// Sous-composants
export { default as HourlyCard } from './HourlyCard';
export { default as DailyCard } from './DailyCard';
export { default as ActivityWidget } from './ActivityWidget';
export { default as PrecipitationBar } from './PrecipitationBar';
export { default as LocationSearchModal } from './LocationSearchModal';

// Types (pour faciliter les imports)
export type { WeatherDetails, HourlyData, PrecipitationData, DailyData, City } from './types'; 