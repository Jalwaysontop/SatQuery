import { useContext } from 'react';
import { QueryContext, type QueryContextType } from './queryContextDef';

export function useQueryContext(): QueryContextType {
  const context = useContext(QueryContext);
  if (!context) {
    throw new Error('useQueryContext must be used within a QueryProvider');
  }
  return context;
}
