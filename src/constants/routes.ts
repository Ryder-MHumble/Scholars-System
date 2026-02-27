export const ROUTES = {
  DASHBOARD: '/',
  INSTITUTIONS: '/institutions',
  INSTITUTION_DETAIL: '/institutions/:universityId',
  INSTITUTION_DEPT: '/institutions/:universityId/:departmentId',
  SCHOLARS: '/scholars',
  SCHOLAR_DETAIL: '/scholars/:scholarId',
  SCHOLAR_EDIT: '/scholars/:scholarId/edit',
  SEARCH: '/search',
  CHANGELOG: '/changelog',
  EXPORT: '/export',
} as const;
