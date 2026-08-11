import { useState, useCallback, useEffect } from 'react';
import type { AdminFormReturn } from '../types/admin';
import { useUnsavedChanges } from './useUnsavedChanges';

export function useAdminForm<T extends object>(
  initialData: T,
  onSave: (data: T) => void | Promise<void>
): AdminFormReturn<T> {
  const [formData, setFormData] = useState<T>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const { markSaved } = useUnsavedChanges(formData, initialData);

  // 언어 전환 시 initialData가 바뀌면 formData도 갱신
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const updateField = useCallback((field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }) as T);
  }, []);

  const saveForm = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      markSaved();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Form save error:', error);
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
    } finally {
      setIsSaving(false);
    }
  }, [formData, markSaved, onSave]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
  }, [initialData]);

  return {
    formData,
    isSaved: showSuccess,
    updateField,
    saveForm,
    setFormData,
    resetForm,
    isSaving,
    showSuccess,
    showError,
  };
}
