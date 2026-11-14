import { ApiError } from './apiClient.ts'

type RequestErrorMessages = {
  notFound?: string
  conflict?: string
  validation?: string
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401
}

export function requestErrorMessage(
  error: unknown,
  messages: RequestErrorMessages = {},
): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return '登录已过期，请重新登录'
    }
    if (error.status === 404) {
      return messages.notFound ?? '请求的数据不存在'
    }
    if (error.status === 409) {
      return messages.conflict ?? '请求冲突，请刷新后重试'
    }
    if (error.status === 422) {
      return messages.validation ?? '输入内容不符合要求'
    }
    if (error.status === 503) {
      return '服务暂时不可用，请稍后重试'
    }
    return error.message
  }

  return '网络连接失败，请稍后重试'
}
