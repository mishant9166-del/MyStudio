import React, { createContext, useContext, useState, useEffect } from 'react';


export interface BaseFilter {
  id: string;
  type: 'color' | 'chroma' | 'blur' | 'sharpen' | 'crop';
  enabled: boolean;
  name: string;
}

export interface ColorFilter extends BaseFilter {
  type: 'color';
  brightness: number; // -100 to 100
  contrast: number; // 0.0 to 2.0 (1.0 default)
  saturation: number; // 0.0 to 2.0 (1.0 default)
  gamma: number; // 0.1 to 3.0 (1.0 default)
  hue: number; // -180 to 180 (0 default)
}

export interface ChromaKeyFilter extends BaseFilter {
  type: 'chroma';
  targetColorR: number; // 0-255
  targetColorG: number; // 0-255
  targetColorB: number; // 0-255
  tolerance: number; // 0.0 to 1.0
  spillReduction: number; // 0.0 to 1.0
}

export interface BlurFilter extends BaseFilter {
  type: 'blur';
  amount: number; // 0 to 50
}

export interface SharpenFilter extends BaseFilter {
  type: 'sharpen';
  amount: number; // 0.0 to 2.0
}

export interface CropFilter extends BaseFilter {
  type: 'crop';
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export type VideoFilter = ColorFilter | ChromaKeyFilter | BlurFilter | SharpenFilter | CropFilter;

interface FilterContextType {
  sourceFilters: Record<string, VideoFilter[]>;
  addFilter: (sourceId: string, filter: VideoFilter) => void;
  updateFilter: (sourceId: string, filterId: string, updates: Partial<VideoFilter>) => void;
  removeFilter: (sourceId: string, filterId: string) => void;
  reorderFilters: (sourceId: string, startIndex: number, endIndex: number) => void;
  toggleFilter: (sourceId: string, filterId: string) => void;
}

const FilterContext = createContext<FilterContextType | null>(null);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Map of sourceId -> array of filters
  const [sourceFilters, setSourceFilters] = useState<Record<string, VideoFilter[]>>({});

  // Send updates to C++ backend whenever sourceFilters changes
  useEffect(() => {
    Object.entries(sourceFilters).forEach(([sourceId, filters]) => {
      // Send enabled filters to C++ backend
      const activeFilters = filters.filter(f => f.enabled);
      window.electronAPI.updateSourceFilters(sourceId, activeFilters).catch(console.error);
    });
  }, [sourceFilters]);

  const addFilter = (sourceId: string, filter: VideoFilter) => {
    setSourceFilters(prev => ({
      ...prev,
      [sourceId]: [...(prev[sourceId] || []), filter]
    }));
  };

  const updateFilter = (sourceId: string, filterId: string, updates: Partial<VideoFilter>) => {
    setSourceFilters(prev => ({
      ...prev,
      [sourceId]: (prev[sourceId] || []).map(f => f.id === filterId ? { ...f, ...updates } as VideoFilter : f)
    }));
  };

  const removeFilter = (sourceId: string, filterId: string) => {
    setSourceFilters(prev => ({
      ...prev,
      [sourceId]: (prev[sourceId] || []).filter(f => f.id !== filterId)
    }));
  };

  const reorderFilters = (sourceId: string, startIndex: number, endIndex: number) => {
    setSourceFilters(prev => {
      const sourceList = Array.from(prev[sourceId] || []);
      const [removed] = sourceList.splice(startIndex, 1);
      sourceList.splice(endIndex, 0, removed);
      return {
        ...prev,
        [sourceId]: sourceList
      };
    });
  };

  const toggleFilter = (sourceId: string, filterId: string) => {
    setSourceFilters(prev => ({
      ...prev,
      [sourceId]: (prev[sourceId] || []).map(f => f.id === filterId ? { ...f, enabled: !f.enabled } as VideoFilter : f)
    }));
  };

  return (
    <FilterContext.Provider value={{
      sourceFilters, addFilter, updateFilter, removeFilter, reorderFilters, toggleFilter
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
};
