import { useState, useCallback, ReactNode } from 'react';

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

interface PromptState extends DialogState {
  placeholder?: string;
  defaultValue?: string;
  inputType?: 'text' | 'url';
  onSubmit?: (value: string) => void;
}

interface ConfirmState extends DialogState {
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

export function useDialog() {
  const [alertState, setAlertState] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
  });

  const [promptState, setPromptState] = useState<PromptState>({
    isOpen: false,
    title: '',
    message: '',
    placeholder: '',
    defaultValue: '',
    inputType: 'text',
  });

  // Alert
  const showAlert = useCallback((
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type,
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Confirm
  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      type?: 'warning' | 'error' | 'info';
      confirmText?: string;
      cancelText?: string;
    }
  ) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      type: options?.type || 'warning',
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      onConfirm,
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Prompt
  const showPrompt = useCallback((
    title: string,
    message: string,
    onSubmit: (value: string) => void,
    options?: {
      placeholder?: string;
      defaultValue?: string;
      inputType?: 'text' | 'url';
    }
  ) => {
    setPromptState({
      isOpen: true,
      title,
      message,
      placeholder: options?.placeholder,
      defaultValue: options?.defaultValue || '',
      inputType: options?.inputType || 'text',
      onSubmit,
    });
  }, []);

  const closePrompt = useCallback(() => {
    setPromptState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    // Alert
    alertState,
    showAlert,
    closeAlert,
    // Confirm
    confirmState,
    showConfirm,
    closeConfirm,
    // Prompt
    promptState,
    showPrompt,
    closePrompt,
  };
}
