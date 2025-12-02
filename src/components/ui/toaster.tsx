
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // A toast can be a simple success message or a destructive error.
        // For success, we want a centered toast with a tick animation.
        // For errors, we keep the default style.
        const isSuccess = props.variant !== 'destructive' && !title;

        return (
          <Toast key={id} {...props} data-success={isSuccess}>
            {isSuccess ? (
              description
            ) : (
              <>
                <div className="grid gap-1">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && (
                    <ToastDescription>{description}</ToastDescription>
                  )}
                </div>
                {action}
                <ToastClose />
              </>
            )}
          </Toast>
        )
      })}
      <ToastViewport className={toasts.some(t => t.variant !== 'destructive' && !t.title) ? 'group/viewport data-[success=true]' : ''} />
    </ToastProvider>
  )
}

    