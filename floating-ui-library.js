/**
 * 悬浮UI库主文件
 * @module FloatingUILibrary
 */

/**
 * 悬浮UI类（可配置版本）
 */
class FloatingUI {
    /**
     * 构造函数
     * @param {Object} config - 配置对象
     * @param {Array<string>} config.icons - 菜单项图标数组（第一个为控制图标）
     * @param {Function} config.onItemClick - 菜单项点击回调函数（参数：index, icon）
     */
    constructor(config) {
        this.config = {
            icons: ['✅', '❤️', '💬', '⭐️', '🔗', '⏬'], // 默认图标
            onItemClick: (index, icon) => console.log(`点击了菜单项: ${icon}`), // 默认回调
            ...config
        };
        this.container = null;
        this.itemsContainer = null;
        this.items = null;
        this.isExpanded = true;
        this.isDragging = false;
        this.isDragAction = false;
        this.init();
    }

    /**
     * 初始化悬浮UI
     */
    async init() {
        try {
            await this.createContainer();
            await this.createItems();
            this.setupDrag();
        } catch (error) {
            console.error('初始化失败:', error);
        }
    }

    /**
     * 创建容器
     */
    async createContainer() {
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '50px';
        this.container.style.right = '20px';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '10px';
        this.container.style.zIndex = '9999';
        this.setNonSelectable(this.container);
        document.body.appendChild(this.container);
    }

    /**
     * 创建菜单项
     */
    async createItems() {
        // 第一个菜单项
        const firstItem = document.createElement('div');
        this.setCommonStyles(firstItem);
        firstItem.textContent = this.config.icons[0];
        firstItem.addEventListener('click', () => this.handleItemClick(0));
        this.container.appendChild(firstItem);

        // 子容器存放其他菜单项
        this.itemsContainer = document.createElement('div');
        this.itemsContainer.style.display = 'flex';
        this.itemsContainer.style.flexDirection = 'column';
        this.itemsContainer.style.gap = '10px';
        this.itemsContainer.style.transform = 'translateY(0)';
        this.itemsContainer.style.opacity = '1';
        this.itemsContainer.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), height 0.3s ease';
        this.itemsContainer.style.overflow = 'hidden';
        this.setNonSelectable(this.itemsContainer);
        this.container.appendChild(this.itemsContainer);

        // 其他菜单项
        this.items = this.config.icons.slice(1).map((icon, index) => {
            const item = document.createElement('div');
            this.setCommonStyles(item);
            item.textContent = icon;
            item.addEventListener('click', () => this.handleItemClick(index + 1));
            return item;
        });

        this.items.forEach(item => this.itemsContainer.appendChild(item));
    }

    /**
     * 设置公共样式
     * @param {HTMLElement} element - 要设置样式的元素
     */
    setCommonStyles(element) {
        element.style.width = '40px';
        element.style.height = '40px';
        element.style.borderRadius = '50%';
        element.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        element.style.display = 'flex';
        element.style.justifyContent = 'center';
        element.style.alignItems = 'center';
        element.style.cursor = 'pointer';
        this.setNonSelectable(element);
    }

    /**
     * 设置元素不可选中
     * @param {HTMLElement} element - 要设置的元素
     */
    setNonSelectable(element) {
        element.style.userSelect = 'none';
        element.style.webkitUserSelect = 'none';
        element.style.msUserSelect = 'none';
    }

    /**
     * 处理菜单项点击事件
     * @param {number} index - 菜单项索引
     */
    handleItemClick(index) {
        if (this.isDragAction) {
            this.isDragAction = false;
            return;
        }

        if (index === 0) {
            this.isExpanded = !this.isExpanded;
            this.itemsContainer.style.transform = this.isExpanded ? 'scale(1)' : 'scale(0.8)';
            this.itemsContainer.style.opacity = this.isExpanded ? '1' : '0';
            this.itemsContainer.style.pointerEvents = this.isExpanded ? 'auto' : 'none';
            this.itemsContainer.style.height = this.isExpanded ? 'auto' : '0';
        } else {
            // 保持展开状态逻辑
            if (!this.isExpanded) {
                this.isExpanded = true;
                this.itemsContainer.style.transform = 'scale(1)';
                this.itemsContainer.style.opacity = '1';
                this.itemsContainer.style.height = 'auto';
                this.itemsContainer.style.pointerEvents = 'auto';
            }
            this.config.onItemClick(index, this.config.icons[index]);
        }
    }

    /**
     * 设置拖动功能（支持PC+移动端）
     */
    setupDrag() {
        this.container.addEventListener('mousedown', (e) => this.startDrag(e));
        this.container.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]));

        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('touchmove', (e) => this.drag(e.touches[0]));

        document.addEventListener('mouseup', (e) => this.stopDrag(e));
        document.addEventListener('touchend', (e) => this.stopDrag(e));
    }

    /**
     * 开始拖动（记录初始位置）
     * @param {MouseEvent|Touch} e - 鼠标或触摸事件
     */
    startDrag(e) {
        this.isDragging = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        const computedStyle = window.getComputedStyle(this.container);
        this.initialLeft = parseInt(computedStyle.left) || 0;
        this.initialTop = parseInt(computedStyle.top) || 0;
    }

    /**
     * 拖动过程（更新坐标）
     * @param {MouseEvent|Touch} e - 鼠标或触摸事件
     */
    drag(e) {
        if (!this.isDragging) return;
        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;
        this.container.style.left = `${this.initialLeft + dx}px`;
        this.container.style.top = `${this.initialTop + dy}px`;
    }

    /**
     * 结束拖动（判断是否为拖动操作）
     * @param {MouseEvent|Touch} e - 鼠标或触摸事件
     */
    stopDrag(e) {
        if (this.isDragging) {
            const dx = Math.abs(e.clientX - this.startX);
            const dy = Math.abs(e.clientY - this.startY);
            this.isDragAction = dx > 5 || dy > 5;
            this.isDragging = false;
        }
    }
}

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.FloatingUI = factory();
    }
})(this, function () {
    return FloatingUI;
});