import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Scene, SceneSource, AppState } from '../../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

type Action = 
  | { type: 'INIT_STATE'; payload: AppState }
  | { type: 'ADD_SCENE'; payload: { name: string } }
  | { type: 'SELECT_SCENE'; payload: { id: string } }
  | { type: 'DELETE_SCENE'; payload: { id: string } }
  | { type: 'RENAME_SCENE'; payload: { id: string, name: string } }
  | { type: 'ADD_SOURCE'; payload: { sceneId: string, source: SceneSource } }
  | { type: 'UPDATE_SOURCE'; payload: { sceneId: string, sourceId: string, updates: Partial<SceneSource> } }
  | { type: 'REMOVE_SOURCE'; payload: { sceneId: string, sourceId: string } }
  | { type: 'REORDER_SOURCE'; payload: { sceneId: string, sourceId: string, direction: 'up' | 'down' | 'top' | 'bottom' } };

const generateDefaultScene = (): Scene => ({
  id: uuidv4(),
  name: 'Preset 1',
  sources: [
    {
      id: uuidv4(),
      type: 'screen',
      name: 'Screen Capture',
      visible: true,
      locked: false,
      zIndex: 0,
      opacity: 1,
      displayId: '0',
      transform: { x: 0, y: 0, width: 1920, height: 1080, rotation: 0 },
      crop: { left: 0, right: 0, top: 0, bottom: 0 }
    } as any,
    {
      id: uuidv4(),
      type: 'text',
      name: 'LIVE',
      visible: true,
      locked: false,
      zIndex: 3,
      opacity: 1,
      text: 'LIVE',
      fontSize: 72,
      fontFamily: 'Arial',
      color: '#ff0000',
      fontWeight: 'bold',
      transform: { x: 50, y: 950, width: 200, height: 100, rotation: 0 },
      crop: { left: 0, right: 0, top: 0, bottom: 0 }
    } as any
  ]
});

const defaultState: AppState = {
  scenes: [],
  activeSceneId: null
};

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'INIT_STATE':
      return action.payload;
    
    case 'ADD_SCENE': {
      const newScene: Scene = { id: uuidv4(), name: action.payload.name, sources: [] };
      return { ...state, scenes: [...state.scenes, newScene], activeSceneId: newScene.id };
    }
    
    case 'SELECT_SCENE':
      return { ...state, activeSceneId: action.payload.id };
      
    case 'DELETE_SCENE': {
      const scenes = state.scenes.filter(s => s.id !== action.payload.id);
      return { 
        ...state, 
        scenes, 
        activeSceneId: state.activeSceneId === action.payload.id ? (scenes[0]?.id || null) : state.activeSceneId 
      };
    }

    case 'RENAME_SCENE':
      return {
        ...state,
        scenes: state.scenes.map(s => s.id === action.payload.id ? { ...s, name: action.payload.name } : s)
      };

    case 'ADD_SOURCE':
      return {
        ...state,
        scenes: state.scenes.map(s => {
          if (s.id !== action.payload.sceneId) return s;
          const maxZ = s.sources.reduce((max, src) => Math.max(max, src.zIndex), -1);
          return {
            ...s,
            sources: [...s.sources, { ...action.payload.source, zIndex: maxZ + 1 }]
          };
        })
      };

    case 'UPDATE_SOURCE':
      return {
        ...state,
        scenes: state.scenes.map(s => {
          if (s.id !== action.payload.sceneId) return s;
          return {
            ...s,
            sources: s.sources.map(src => src.id === action.payload.sourceId ? { ...src, ...action.payload.updates } as SceneSource : src)
          };
        })
      };

    case 'REMOVE_SOURCE':
      return {
        ...state,
        scenes: state.scenes.map(s => {
          if (s.id !== action.payload.sceneId) return s;
          return { ...s, sources: s.sources.filter(src => src.id !== action.payload.sourceId) };
        })
      };

    case 'REORDER_SOURCE':
      return {
        ...state,
        scenes: state.scenes.map(s => {
          if (s.id !== action.payload.sceneId) return s;
          const sources = [...s.sources].sort((a, b) => a.zIndex - b.zIndex);
          const index = sources.findIndex(src => src.id === action.payload.sourceId);
          if (index === -1) return s;

          if (action.payload.direction === 'up' && index < sources.length - 1) {
            const temp = sources[index].zIndex;
            sources[index].zIndex = sources[index + 1].zIndex;
            sources[index + 1].zIndex = temp;
          } else if (action.payload.direction === 'down' && index > 0) {
            const temp = sources[index].zIndex;
            sources[index].zIndex = sources[index - 1].zIndex;
            sources[index - 1].zIndex = temp;
          } else if (action.payload.direction === 'top') {
            const maxZ = sources[sources.length - 1].zIndex;
            sources[index].zIndex = maxZ + 1;
          } else if (action.payload.direction === 'bottom') {
            const minZ = sources[0].zIndex;
            sources[index].zIndex = minZ - 1;
          }
          
          return { ...s, sources };
        })
      };

    default:
      return state;
  }
};

interface SceneContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  activeScene: Scene | undefined;
}

const SceneContext = createContext<SceneContextType | undefined>(undefined);

export const SceneProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, defaultState);

  useEffect(() => {
    const saved = localStorage.getItem('VideoStudioState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.scenes && parsed.scenes.length > 0) {
          dispatch({ type: 'INIT_STATE', payload: parsed });
          return;
        }
      } catch (e) {}
    }
    
    // Auto-generate Gaming scene on fresh launch
    const gamingScene = generateDefaultScene();
    dispatch({ 
      type: 'INIT_STATE', 
      payload: { scenes: [gamingScene], activeSceneId: gamingScene.id }
    });
  }, []);

  useEffect(() => {
    if (state.scenes.length > 0) {
      localStorage.setItem('VideoStudioState', JSON.stringify(state));
    }
  }, [state]);

  const activeScene = state.scenes.find(s => s.id === state.activeSceneId);

  return (
    <SceneContext.Provider value={{ state, dispatch, activeScene }}>
      {children}
    </SceneContext.Provider>
  );
};

export const useScenes = () => {
  const context = useContext(SceneContext);
  if (context === undefined) {
    throw new Error('useScenes must be used within a SceneProvider');
  }
  return context;
};
