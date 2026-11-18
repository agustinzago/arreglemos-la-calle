// Fixtures de break-ui, uno por área. src/lib los consulta antes de ir a Supabase (solo en __DEV__).
// Cada función devuelve undefined cuando no hay fixture para el modo actual: entonces va el dato real.
export { assertLiveData } from '../data-mode';
export * from './report-detail';
export * from './map';
export * from './my-reports';
export * from './flow-capture';
export * from './flow-submit';
