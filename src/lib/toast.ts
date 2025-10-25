import { toast as sonnerToast } from 'sonner'

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  loading: (message: string) => sonnerToast.loading(message),
  info: (message: string) => sonnerToast.info(message),
}
