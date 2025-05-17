export function createDraggableWindow(contentElement) {
    // Create outer container
    const win = document.createElement('div');
    win.classList.add('draggable-window');
    win.style.position = 'absolute';
    win.style.top = '100px';
    win.style.left = '100px';
    win.style.border = '1px solid #ccc';
    win.style.background = '#fff';
    win.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    win.style.zIndex = '1000';
    win.style.display = 'inline-block';

    // Title bar
    const titleBar = document.createElement('div');
    titleBar.style.background = '#444';
    titleBar.style.color = '#fff';
    titleBar.style.padding = '5px 10px';
    titleBar.style.cursor = 'move';
    titleBar.style.display = 'flex';
    titleBar.style.justifyContent = 'space-between';
    titleBar.style.alignItems = 'center';

    const titleText = document.createElement('span');
    titleText.textContent = 'Window';

    const buttonContainer = document.createElement('div');
    const minBtn = document.createElement('button');
    minBtn.textContent = '—';
    const maxBtn = document.createElement('button');
    maxBtn.textContent = '□';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';

    [minBtn, maxBtn, closeBtn].forEach(btn => {
        btn.style.marginLeft = '5px';
        btn.style.cursor = 'pointer';
    });

    buttonContainer.append(minBtn, maxBtn, closeBtn);
    titleBar.append(titleText, buttonContainer);
    win.append(titleBar);

    // Content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.style.display = 'inline-block';
    contentWrapper.appendChild(contentElement);
    win.append(contentWrapper);

    document.body.appendChild(win);

    // Resize to fit content
    const resizeToFit = () => {
        // Reset to natural width
        contentWrapper.style.width = 'auto';
        contentWrapper.style.height = 'auto';
        win.style.width = contentWrapper.offsetWidth + 'px';
        win.style.height = titleBar.offsetHeight + contentWrapper.offsetHeight + 'px';
    };

    resizeToFit();
    // Re-apply when content resizes
    new ResizeObserver(resizeToFit).observe(contentWrapper);

    // Dragging
    let isDragging = false, offsetX = 0, offsetY = 0;
    titleBar.addEventListener('mousedown', e => {
        isDragging = true;
        offsetX = e.clientX - win.offsetLeft;
        offsetY = e.clientY - win.offsetTop;
        document.body.style.userSelect = 'none';
    });
    document.addEventListener('mouseup', () => {
        isDragging = false;
        document.body.style.userSelect = '';
    });
    document.addEventListener('mousemove', e => {
        if (isDragging) {
            win.style.left = `${e.clientX - offsetX}px`;
            win.style.top = `${e.clientY - offsetY}px`;
        }
    });

    // Window controls
    let isMinimized = false;
    let originalDisplay = contentWrapper.style.display;

    minBtn.addEventListener('click', () => {
        if (!isMinimized) {
            originalDisplay = contentWrapper.style.display;
            contentWrapper.style.display = 'none';
            isMinimized = true;
            resizeToFit();
        }
    });

    maxBtn.addEventListener('click', () => {
        const maximized = win.dataset.maximized === 'true';
        if (!maximized) {
            win.dataset.prev = JSON.stringify({
                top: win.style.top,
                left: win.style.left,
                width: win.style.width,
                height: win.style.height
            });
            win.style.top = '0';
            win.style.left = '0';
            win.style.width = '100vw';
            win.style.height = '100vh';
            contentWrapper.style.width = '100%';
            contentWrapper.style.height = `calc(100% - ${titleBar.offsetHeight}px)`;
            win.dataset.maximized = 'true';
        } else {
            const prev = JSON.parse(win.dataset.prev);
            win.style.top = prev.top;
            win.style.left = prev.left;
            win.style.width = prev.width;
            win.style.height = prev.height;
            contentWrapper.style.width = 'auto';
            contentWrapper.style.height = 'auto';
            delete win.dataset.maximized;
            resizeToFit();
        }
    });

    closeBtn.addEventListener('click', () => win.remove());

    // Restore with backslash
    document.addEventListener('keydown', (e) => {
        if (e.key === '\\' && isMinimized) {
            contentWrapper.style.display = originalDisplay || 'block';
            isMinimized = false;
            resizeToFit();
        }
    });

    // Add resizers
    const sides = ['top', 'right', 'bottom', 'left',
                                 'top-right', 'top-left', 'bottom-right', 'bottom-left'];
    const cursorMap = {
      top: 'ns-resize',
      bottom: 'ns-resize',
      left: 'ew-resize',
      right: 'ew-resize',
      'top-left': 'nwse-resize',
      'top-right': 'nesw-resize',
      'bottom-left': 'nesw-resize',
      'bottom-right': 'nwse-resize'
    };
    sides.forEach(side => {
        const resizer = document.createElement('div');
        resizer.classList.add('resizer', side);
        Object.assign(resizer.style, {
        position: 'absolute',
        zIndex: '1001',
        background: 'transparent',
        ...(side.includes('top') && { top: '0', height: '5px' }),
        ...(side.includes('bottom') && { bottom: '0', height: '5px' }),
        ...(side.includes('left') && { left: '0', width: '5px' }),
        ...(side.includes('right') && { right: '0', width: '5px' }),
        ...(side.includes('left') || side.includes('right') ? { top: '0', bottom: '0' } : {}),
        ...(side.includes('top') || side.includes('bottom') ? { left: '0', right: '0' } : {}),
        cursor: cursorMap[side]
    });

        win.appendChild(resizer);

        let isResizing = false;
        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isResizing = true;
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = win.offsetWidth;
            const startHeight = win.offsetHeight;
            const startTop = win.offsetTop;
            const startLeft = win.offsetLeft;

            function resizeMove(ev) {
                if (!isResizing) return;
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;

                if (side.includes('right')) win.style.width = `${startWidth + dx}px`;
                if (side.includes('bottom')) win.style.height = `${startHeight + dy}px`;
                if (side.includes('left')) {
                    win.style.width = `${startWidth - dx}px`;
                    win.style.left = `${startLeft + dx}px`;
                }
                if (side.includes('top')) {
                    win.style.height = `${startHeight - dy}px`;
                    win.style.top = `${startTop + dy}px`;
                }
            }

            function stopResize() {
                isResizing = false;
                document.removeEventListener('mousemove', resizeMove);
                document.removeEventListener('mouseup', stopResize);
            }

            document.addEventListener('mousemove', resizeMove);
            document.addEventListener('mouseup', stopResize);
        });
    });

    return win;
}
