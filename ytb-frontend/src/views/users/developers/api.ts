import request from '@/utils/request';
import type {
  DeveloperItem,
  DeveloperListSummary,
  DeveloperPayload,
  DeveloperQuery
} from './types';

interface DeveloperListResult {
  data: DeveloperItem[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
  summary?: DeveloperListSummary | null;
}

function resolveItems(...candidates: any[]): DeveloperItem[] {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    if (Array.isArray(candidate)) {
      return candidate as DeveloperItem[];
    }

    if (Array.isArray(candidate.items)) {
      return candidate.items as DeveloperItem[];
    }

    if (Array.isArray(candidate.data)) {
      return candidate.data as DeveloperItem[];
    }
  }

  return [];
}

function buildMetaSources(payload: any): any[] {
  const sources: any[] = [];

  const root = payload ?? {};
  const nested = root?.data && typeof root.data === 'object' && !Array.isArray(root.data) ? root.data : null;

  const push = (value?: any) => {
    if (value) {
      sources.push(value);
    }
  };

  push(root);
  push(root.meta);
  push(root.pagination);
  push(root.meta?.pagination);

  if (nested) {
    push(nested);
    push(nested.meta);
    push(nested.pagination);
    push(nested.meta?.pagination);
  }

  return sources;
}

function pickNumber(key: string, fallback: number, sources: any[]): number {
  for (const source of sources) {
    if (source && source[key] !== undefined && source[key] !== null) {
      const value = Number(source[key]);
      if (!Number.isNaN(value)) {
        return value;
      }
    }

    // also try camelCase variants if key is snake_case
    if (key.includes('_')) {
      const camelKey = key.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
      if (source && source[camelKey] !== undefined && source[camelKey] !== null) {
        const value = Number(source[camelKey]);
        if (!Number.isNaN(value)) {
          return value;
        }
      }
    }
  }

  return fallback;
}

export async function fetchDevelopers(params: DeveloperQuery): Promise<DeveloperListResult> {
  const response = await request({
    url: '/api/dev/v1/developers',
    method: 'get',
    params: {
      page: params.page,
      per_page: params.pageSize,
      keyword: params.keyword,
      status: params.status,
      subscription_status: params.subscription_status,
      subscription_plan: params.subscription_plan
    }
  });

  const payload = response ?? {};
  const nested = payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
    ? payload.data
    : null;

  const items = resolveItems(payload, nested, payload?.data, nested?.data);
  const metaSources = buildMetaSources(payload);

  const total = pickNumber('total', items.length, metaSources);
  const perPage = pickNumber('per_page', params.pageSize || items.length || 20, metaSources) || 20;
  const currentPage = pickNumber('current_page', params.page || 1, metaSources) || 1;
  const lastPage = pickNumber('last_page', Math.ceil(total / (perPage || 1)) || 1, metaSources) || 1;

  const summary = payload.summary ?? payload.data?.summary ?? null;

  return {
    data: items,
    total,
    current_page: currentPage,
    per_page: perPage,
    last_page: lastPage,
    summary
  };
}

export async function createDeveloper(payload: DeveloperPayload) {
  return request({
    url: '/api/dev/v1/developers',
    method: 'post',
    data: payload
  });
}

export async function updateDeveloper(id: number, payload: DeveloperPayload) {
  return request({
    url: `/api/dev/v1/developers/${id}`,
    method: 'put',
    data: payload
  });
}

export async function toggleDeveloperStatus(id: number, enable: boolean) {
  return request({
    url: `/api/dev/v1/developers/${id}/status`,
    method: 'patch',
    data: {
      status: enable ? 'active' : 'disabled'
    }
  });
}
