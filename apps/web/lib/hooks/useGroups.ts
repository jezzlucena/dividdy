'use client';

import type { Group, CreateGroupRequest } from '@dividdy/shared-types';
import useSWR from 'swr';

import { api } from '../api';

export function useGroups() {
  const { data, error, isLoading, mutate } = useSWR<Group[]>(
    'groups',
    () => api.getGroups(),
    {
      revalidateOnFocus: false,
    }
  );

  const createGroup = async (data: CreateGroupRequest) => {
    const newGroup = await api.createGroup(data);
    mutate();
    return newGroup;
  };

  const joinGroup = async (inviteCode: string) => {
    const group = await api.joinGroup(inviteCode);
    mutate();
    return group;
  };

  return {
    groups: data || [],
    isLoading,
    error,
    createGroup,
    joinGroup,
    refresh: mutate,
  };
}

export function useGroup(id: string) {
  const { data, error, isLoading, mutate } = useSWR<Group>(
    id ? `group-${id}` : null,
    () => api.getGroup(id),
    {
      revalidateOnFocus: false,
    }
  );

  const updateGroup = async (updateData: Partial<Group>) => {
    const updated = await api.updateGroup(id, updateData);
    mutate(updated);
    return updated;
  };

  const deleteGroup = async () => {
    await api.deleteGroup(id);
  };

  return {
    group: data,
    isLoading,
    error,
    updateGroup,
    deleteGroup,
    refresh: mutate,
  };
}

