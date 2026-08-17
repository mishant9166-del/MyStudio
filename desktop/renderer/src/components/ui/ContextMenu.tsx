import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
  items?: ContextMenuItem[]; // For submenus
  type?: 'item' | 'separator' | 'header';
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  className?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose, className = '' }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<{ id: string, rect: DOMRect } | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Use mousedown instead of click to close sooner
    document.addEventListener('mousedown', handleClickOutside);
    // Also close on escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to not go off-screen
  const [position, setPosition] = useState({ x, y });
  
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let newX = x;
      let newY = y;

      if (x + rect.width > window.innerWidth) {
        newX = window.innerWidth - rect.width - 5;
      }
      if (y + rect.height > window.innerHeight) {
        newY = y - rect.height;
        if (newY < 0) {
          newY = window.innerHeight - rect.height - 5;
        }
      }
      
      setPosition({ 
        x: Math.max(5, newX), 
        y: Math.max(5, newY) 
      });
    }
  }, [x, y]);

  const menuContent = (
    <div
      ref={menuRef}
      className={`fixed z-[9999] bg-white border border-slate-200 shadow-xl rounded py-1 min-w-[200px] text-[12px] text-slate-600 overflow-y-auto overflow-x-hidden ${className}`}
      style={{ left: position.x, top: position.y, maxHeight: 'calc(100vh - 10px)' }}
      onContextMenu={(e) => e.preventDefault()} // Prevent native context menu from opening on top
    >
      {items.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={`sep-${index}`} className="h-px bg-slate-100 my-1 mx-2" />;
        }
        
        if (item.type === 'header') {
          return (
            <div key={item.id} className="px-3 py-1.5 text-slate-400 text-center bg-slate-50/50 text-xs">
              {item.label}
              <div className="h-px bg-slate-200 mt-1.5 -mx-3 mb-0.5" />
            </div>
          );
        }

        const hasSubmenu = item.items && item.items.length > 0;
        const isActive = activeSubmenu?.id === item.id;

        return (
          <div
            key={item.id}
            className="relative"
            onMouseEnter={(e) => setActiveSubmenu({ id: item.id, rect: e.currentTarget.getBoundingClientRect() })}
            onMouseLeave={() => setActiveSubmenu(null)}
          >
            <button
              onClick={(e) => {
                if (hasSubmenu) {
                  e.stopPropagation();
                } else {
                  item.onClick?.();
                  onClose();
                }
              }}
              className="w-full flex items-center px-3 py-1 hover:bg-[#F2F7F9] hover:text-[#00B4FF] transition-colors"
            >
              <div className="w-5 flex justify-center mr-2 opacity-80 [&>svg]:w-4 [&>svg]:h-4">
                {item.icon}
              </div>
              <span className="flex-1 text-left">{item.label}</span>
              
              {item.shortcut && (
                <span className="text-slate-400 text-[10px] ml-4">{item.shortcut}</span>
              )}
              
              {hasSubmenu && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 ml-2" />
              )}
            </button>

            {hasSubmenu && isActive && activeSubmenu && (
              <div 
                className="fixed z-[10000]"
                style={{ left: activeSubmenu.rect.right + 2, top: activeSubmenu.rect.top }}
              >
                <ContextMenu
                  x={0}
                  y={0}
                  items={item.items!}
                  onClose={onClose}
                  className="!relative shadow-xl"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // If this is a submenu (indicated by !relative className), don't use a portal for it, 
  // so it stays nested in the parent's DOM for layout and hover logic.
  if (className.includes('!relative')) {
    return menuContent;
  }

  return createPortal(menuContent, document.body);
};
