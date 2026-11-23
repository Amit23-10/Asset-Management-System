'use client'

import { ERP_METHODS } from '@/lib/config'
import { apiRequest, buildQuery, uploadFile } from '@/lib/api/client'
import type {
  ApiListResponse,
  CWRoleDto,
  CWUserDto,
  RegistrationOcrResult,
  WorkshopNavigation,
} from '@/lib/types'

type ListUsersParams = {
  search?: string
  status?: string
  page?: number
  pageSize?: number
}

export const workshopApi = {
  navigation() {
    return apiRequest<WorkshopNavigation>(ERP_METHODS.navigation)
  },

  listUsers(params: ListUsersParams = {}) {
    return apiRequest<ApiListResponse<CWUserDto>>(`${ERP_METHODS.listUsers}${buildQuery(params)}`)
  },

  listRoles() {
    return apiRequest<CWRoleDto[]>(ERP_METHODS.listRoles)
  },

  createUser(input: { user: Partial<CWUserDto> & { password?: string } }) {
    return apiRequest<CWUserDto>(ERP_METHODS.createUser, { method: 'POST', body: input })
  },

  updateUser(id: string, patch: Partial<CWUserDto> & { password?: string }) {
    return apiRequest<CWUserDto>(ERP_METHODS.updateUser, {
      method: 'POST',
      body: { id, ...patch },
    })
  },

  setUserStatus(id: string, status: string) {
    return apiRequest<CWUserDto>(ERP_METHODS.setUserStatus, {
      method: 'POST',
      body: { id, status },
    })
  },

  heartbeat() {
    return apiRequest<{ ok: boolean }>(ERP_METHODS.heartbeat, { method: 'POST', silent: true })
  },

  upload(file: File, opts: { folder?: string; isPrivate?: boolean } = {}) {
    return uploadFile(file, opts)
  },

  readRegistrationPlate(fileUrl: string) {
    return apiRequest<RegistrationOcrResult>(ERP_METHODS.registrationOcr, {
      method: 'POST',
      body: { data: { fileUrl } },
    })
  },
}
