import React from 'react';
import { createPortal } from 'react-dom';

interface DesktopSpeedMenuProps {
    showSpeedMenu: boolean;
    playbackRate: number;
    speeds: number[];
    onSpeedChange: (speed: number) => void;
    onToggleSpeedMenu: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
    isRotated?: boolean;
}

export function DesktopSpeedMenu({
    showSpeedMenu,
    playbackRate,
    speeds,
    onSpeedChange,
    onToggleSpeedMenu,
    onMouseEnter,
    onMouseLeave,
    containerRef,
    isRotated = false
}: DesktopSpeedMenuProps) {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const menuRef = React.useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0, maxHeight: 'none', openUpward: false });

    const [isFullscreen, setIsFullscreen] = React.useState(false);

    React.useEffect(() => {
        const updateFullscreen = () => {
            // Check both native fullscreen and window fullscreen (CSS-based)
            const nativeFullscreen = !!document.fullscreenElement;
            const windowFullscreen = containerRef.current?.closest('.is-web-fullscreen') !== null;
            setIsFullscreen(nativeFullscreen || windowFullscreen);
        };
        document.addEventListener('fullscreenchange', updateFullscreen);
        // Also check periodically for window fullscreen changes (CSS class based)
        const interval = setInterval(updateFullscreen, 500);
        updateFullscreen();
        return () => {
            document.removeEventListener('fullscreenchange', updateFullscreen);
            clearInterval(interval);
        };
    }, [containerRef]);

    // Calculate menu position with available space awareness
    const calculateMenuPosition = React.useCallback(() => {
        if (!buttonRef.current || !containerRef.current) return;

        const buttonRect = buttonRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Space available below and above the button
        const spaceBelow = viewportHeight - buttonRect.bottom - 20; // 20px margin
        const spaceAbove = buttonRect.top - containerRect.top - 20;

        // Estimate menu height (or use actual if already rendered)
        const estimatedMenuHeight = 250; // approximate height of speed menu
        const actualMenuHeight = menuRef.current?.offsetHeight || estimatedMenuHeight;

        // Determine if we should open upward
        const openUpward = spaceBelow < Math.min(actualMenuHeight, 200) && spaceAbove > spaceBelow;

        // Calculate max-height based on available space
        const maxHeight = openUpward
            ? Math.min(spaceAbove, actualMenuHeight)
            : Math.min(spaceBelow, viewportHeight * 0.7);

        if (openUpward) {
            setMenuPosition({
                top: buttonRect.top - containerRect.top - 10, // Position above button
                left: buttonRect.right - containerRect.left,
                maxHeight: `${maxHeight}px`,
                openUpward: true
            });
        } else {
            setMenuPosition({
                top: buttonRect.bottom - containerRect.top + 10,
                left: buttonRect.right - containerRect.left,
                maxHeight: `${maxHeight}px`,
                openUpward: false
            });
        }
    }, [containerRef]);

    // When rotated, use direct viewport positioning
    const calculateRotatedPosition = React.useCallback(() => {
        if (!buttonRef.current) return;
        const buttonRect = buttonRef.current.getBoundingClientRect();
        setMenuPosition({
            top: buttonRect.bottom + 10,
            left: buttonRect.right,
            maxHeight: `${window.innerHeight * 0.6}px`,
            openUpward: false
        });
    }, []);

    // Auto-close menu on scroll
    React.useEffect(() => {
        if (!showSpeedMenu) return;
        const handleScroll = () => {
            if (showSpeedMenu) {
                onToggleSpeedMenu();
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [showSpeedMenu, onToggleSpeedMenu]);

    React.useEffect(() => {
        if (showSpeedMenu) {
            if (isRotated) {
                calculateRotatedPosition();
            } else {
                calculateMenuPosition();
            }
            const timer = setTimeout(() => {
                if (isRotated) {
                    calculateRotatedPosition();
                } else {
                    calculateMenuPosition();
                }
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [showSpeedMenu, calculateMenuPosition, calculateRotatedPosition, isRotated]);

    const handleToggle = () => {
        if (!showSpeedMenu) {
            if (isRotated) {
                calculateRotatedPosition();
            } else {
                calculateMenuPosition();
            }
        }
        onToggleSpeedMenu();
    };

    const MenuContent = (
        <div
            ref={menuRef}
            className={`${isRotated ? 'fixed' : 'absolute'} z-[2147483647] bg-[var(--glass-bg)] backdrop-blur-[25px] saturate-[180%] rounded-[var(--radius-2xl)] border border-[var(--glass-border)] shadow-[var(--shadow-md)] p-1 sm:p-1.5 w-fit min-w-[3.5rem] sm:min-w-[4.5rem] animate-in fade-in zoom-in-95 duration-200 overflow-y-auto`}
            style={{
                top: isRotated ? `${menuPosition.top}px` : (menuPosition.openUpward ? 'auto' : `${menuPosition.top}px`),
                bottom: (!isRotated && menuPosition.openUpward) ? `calc(100% - ${menuPosition.top}px + 10px)` : 'auto',
                left: `${menuPosition.left}px`,
                transform: 'translateX(-100%)',
                maxHeight: menuPosition.maxHeight,
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
        >
            {speeds.map((speed) => (
                <button
                    key={speed}
                    onClick={() => onSpeedChange(speed)}
                    className={`w-full px-3 py-1 sm:px-4 sm:py-1.5 rounded-[var(--radius-2xl)] text-xs sm:text-sm font-medium transition-colors ${playbackRate === speed
                        ? 'bg-[var(--accent-color)] text-white'
                        : 'text-[var(--text-color)] hover:bg-[color-mix(in_srgb,var(--accent-color)_15%,transparent)]'
                        }`}
                >
                    {speed}x
                </button>
            ))}
        </div>
    );

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={handleToggle}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className="group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all duration-300 hover:scale-110 active:scale-95 text-white/90 font-medium text-xs sm:text-sm"
                aria-label="播放速度"
            >
                {playbackRate}x
            </button>

            {/* Speed Menu (Portal) */}
            {showSpeedMenu && typeof document !== 'undefined' && createPortal(MenuContent, isRotated ? document.body : (containerRef.current || document.body))}
        </div>
    );
}
