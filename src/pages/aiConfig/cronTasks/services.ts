import request from '@/utils/request';
import { RequestMethod } from '@/store/common';

import { AICronTask, AICronTaskLog, AICronTaskRunResult } from './types';

export type { AICronTask, AICronTaskLog, AICronTaskRunResult };

export const getList = function (): Promise<AICronTask[]> {
  return request('/api/n9e/ai-cron-tasks', {
    method: RequestMethod.Get,
  }).then((res) => res.dat ?? []);
};

export const postItem = function (data: AICronTask) {
  return request('/api/n9e/ai-cron-tasks', {
    method: RequestMethod.Post,
    data,
  }).then((res) => res.dat);
};

export const getItem = function (id: number): Promise<AICronTask> {
  return request(`/api/n9e/ai-cron-task/${id}`, {
    method: RequestMethod.Get,
  }).then((res) => res.dat);
};

export const putItem = function (id: number, data: AICronTask) {
  return request(`/api/n9e/ai-cron-task/${id}`, {
    method: RequestMethod.Put,
    data,
  }).then((res) => res.dat);
};

export const deleteItem = function (id: number) {
  return request(`/api/n9e/ai-cron-task/${id}`, {
    method: RequestMethod.Delete,
  }).then((res) => res.dat);
};

export const enableItem = function (id: number) {
  return request(`/api/n9e/ai-cron-task/${id}/enable`, {
    method: RequestMethod.Post,
  }).then((res) => res.dat);
};

export const disableItem = function (id: number) {
  return request(`/api/n9e/ai-cron-task/${id}/disable`, {
    method: RequestMethod.Post,
  }).then((res) => res.dat);
};

export const runItem = function (id: number): Promise<AICronTaskRunResult> {
  return request(`/api/n9e/ai-cron-task/${id}/run`, {
    method: RequestMethod.Post,
  }).then((res) => res.dat);
};

export const getLogs = function (id: number, params: { p: number; limit: number }): Promise<{ list: AICronTaskLog[]; total: number }> {
  return request(`/api/n9e/ai-cron-task/${id}/logs`, {
    method: RequestMethod.Get,
    params,
  }).then((res) => res.dat);
};
