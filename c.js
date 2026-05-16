/**
 * c.js - 增强版CSV查看器
 * 功能：支持折叠重复前缀、分页、字符串范围选择作为文件夹
 */

class CSVViewer {
  constructor() {
    // URL参数
    this.params = new URL(location.href).searchParams;
    this.readfile = this.params.get("a") || "iblp";

    // 配置常量
    this.PAGE_SIZE = 1e300;

    // 数据状态
    this.fullDataset = []; // 原始全部数据行
    this.headers = []; // 表头数组
    this.displayGroups = []; // 显示结构：普通行 或 折叠组对象
    this.currentPage = 1;
    this.totalPages = 1;
    this.currentExpandedRows = []; // 当前展开后的完整行列表
    this.customFolders = []; // 用户自定义的文件夹范围

    // DOM元素缓存
    this.tbody = document.getElementById("tbody");
    this.htmldata = document.getElementById("htmldata");
    this.paginationDiv = document.getElementById("pagination");
    this.recordInfoSpan = document.getElementById("record-info");
    this.tableHead = document.getElementById("table-head");

    // 绑定事件
    this.bindEvents();
  }
  escapeHtmlWithHighlight(x) {
    return x;
  }
  /**
   * 绑定事件监听
   */
  bindEvents() {
    document.addEventListener("DOMContentLoaded", () => this.init());
  }

  /**
   * 初始化应用
   */
  async init() {
    try {
      await this.loadCSV();
      this.renderCustomFolderPanel();
      this.renderSidebar();
    } catch (error) {
      console.error("初始化失败:", error);
      this.showError(error.message);
    }
  }

  /**
   * 解析CSV文本
   * @param {string} text - CSV文本内容
   * @returns {Array<Array<string>>} 二维数组形式的表格数据
   */
  parseCSV(text) {
    const rows = [];
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.trim() === "") continue;
      const cells = [];
      let cell = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cell += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === "," && !inQuotes) {
          cells.push(cell.trim());
          cell = "";
        } else {
          cell += char;
        }
      }
      cells.push(cell.trim());
      rows.push(cells);
    }
    return rows;
  }

  /**
   * 转义HTML特殊字符
   * @param {string} str - 待转义的字符串
   * @returns {string} 转义后的字符串
   */
  escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * 转义HTML并高亮匹配的搜索关键词
   * @param {string} str - 待处理的字符串
   * @returns {string} 处理后的字符串
   */
  escapeHtmlWithHighlight(str) {
    if (!str) return "";
    const escaped = this.escapeHtml(str);
    if (!this.searchKeyword) return escaped;
    const regex = new RegExp(`(${this.escapeRegex(this.searchKeyword)})`, "gi");
    return escaped.replace(regex, '<span class="highlight">$1</span>');
  }

  /**
   * 转义正则表达式特殊字符
   * @param {string} str - 待转义的字符串
   * @returns {string} 转义后的字符串
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  /**
   * 转义HTML特殊字符
   * @param {string} str - 待转义的字符串
   * @returns {string} 转义后的字符串
   */
  escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * 加载CSV文件
   */
  async loadCSV() {
    const response = await fetch(`${this.readfile}.csv`);
    if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);

    const text = await response.text();
    const rows = this.parseCSV(text);
    if (!rows || rows.length === 0) throw new Error("CSV无数据");

    // 分离表头和数据
    this.headers = rows[0];
    this.fullDataset = rows.slice(1);

    // 确保至少3列
    while (this.headers.length < 3) {
      this.headers.push(`Column ${this.headers.length + 1}`);
    }

    // 渲染表头
    this.renderTableHeader();

    // 构建分组结构
    this.buildDisplayGroups();

    // 初始化显示
    this.refreshDisplay();

    // 保存到全局供调试
    window.dataset = this.fullDataset;
    console.log(
      `加载完成: 原始行数=${this.fullDataset.length}, 分组数=${this.displayGroups.length}`,
    );
  }

  /**
   * 渲染表头
   */
  renderTableHeader() {
    this.tableHead.innerHTML = `
      <tr>${this.headers.map((h) => `<th>${this.escapeHtml(h)}</th>`).join("")}</tr>
    `;
  }

  /**
   * 构建分组结构（基于连续相同前缀的块 + 用户自定义文件夹）
   */
  buildDisplayGroups() {
    const groups = [];
    let i = 0;

    // 标记被自定义文件夹覆盖的行
    const coveredRows = new Set();

    // 先处理自定义文件夹
    for (const folder of this.customFolders) {
      const folderRows = [];
      for (let j = 0; j < this.fullDataset.length; j++) {
        const row = this.fullDataset[j];
        const firstCol = row[0] || "";
        if (firstCol >= folder.startStr && firstCol <= folder.endStr) {
          folderRows.push(row);
          coveredRows.add(j);
        }
      }

      if (folderRows.length > 0) {
        groups.push({
          type: "group",
          collapsed: true,
          rows: folderRows,
          prefix: folder.name,
          isCustom: true,
          folderId: folder.id,
        });
      }
    }

    // 处理未被覆盖的行（原有前缀折叠逻辑）
    while (i < this.fullDataset.length) {
      // 跳过已被自定义文件夹覆盖的行
      if (coveredRows.has(i)) {
        i++;
        continue;
      }

      const row = this.fullDataset[i];
      const firstCol = row[0] || "";
      groups.push({
        type: "row",
        data: row,
      });
      i++;
      // }
    }

    this.displayGroups = groups;
  }

  /**
   * 根据分组结构和折叠状态，生成展开后的完整行列表（支持搜索过滤）
   * @returns {Array<Array<string>>} 展开后的行列表
   */
  getExpandedRowsFromGroups() {
    const expanded = [];
    for (const item of this.displayGroups) {
      if (item.type === "row") {
        // 如果有搜索关键词，检查是否匹配
        if (this.searchKeyword) {
          const rowText = item.data.join(" ");
          if (
            rowText.toLowerCase().includes(this.searchKeyword.toLowerCase())
          ) {
            expanded.push(item.data);
          }
        } else {
          expanded.push(item.data);
        }
      } else {
        // 组标题行
        const groupRowCount = item.rows.length;
        const titleIcon = item.collapsed ? "📂" : "📁";
        const titlePrefix = item.isCustom ? "📁" : "📂";
        const titleCell = `${titleIcon} ${titlePrefix} ${item.isCustom ? "自定义文件夹" : "前缀相同的分析"} (${item.prefix}) - 共 ${groupRowCount} 行`;

        const headerRow = [
          titleCell,
          `包含 ${groupRowCount} 条记录`,
          item.isCustom ? `点击展开/收起 | 删除文件夹` : `点击展开/收起`,
        ];

        // 如果有搜索关键词，检查组内是否有匹配项
        if (this.searchKeyword) {
          const hasMatch = item.rows.some((row) =>
            row
              .join(" ")
              .toLowerCase()
              .includes(this.searchKeyword.toLowerCase()),
          );
          if (hasMatch) {
            expanded.push(headerRow);
            // 如果未折叠且有匹配，添加组内匹配的行
            if (!item.collapsed) {
              for (const r of item.rows) {
                if (
                  r
                    .join(" ")
                    .toLowerCase()
                    .includes(this.searchKeyword.toLowerCase())
                ) {
                  expanded.push([...r]);
                }
              }
            }
          }
        } else {
          expanded.push(headerRow);
          // 如果未折叠，添加组内所有行
          if (!item.collapsed) {
            for (const r of item.rows) {
              expanded.push([...r]);
            }
          }
        }
      }
    }
    return expanded;
  }

  /**
   * 渲染搜索面板
   */
  renderSearchPanel() {
    const searchDiv = document.getElementById("search-panel");
    if (!searchDiv) return;

    searchDiv.innerHTML = `
      <div class="search-panel">
        <h3>🔍 搜索</h3>
        <div class="search-form">
          <input 
            type="text" 
            id="search-input" 
            placeholder="输入搜索关键词..." 
            value="${this.escapeHtml(this.searchKeyword)}"
            size="50"
          />
          <button id="search-btn">搜索</button>
          <button id="clear-search-btn">清除</button>
        </div>
        <div id="search-result-info"></div>
      </div>
    `;

    // 绑定搜索输入事件
    const searchInput = document.getElementById("search-input");
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        this.performSearch(searchInput.value);
      }
    });

    // 绑定搜索按钮事件
    document.getElementById("search-btn").addEventListener("click", () => {
      this.performSearch(searchInput.value);
    });

    // 绑定清除按钮事件
    document
      .getElementById("clear-search-btn")
      .addEventListener("click", () => {
        searchInput.value = "";
        this.performSearch("");
      });
  }

  /**
   * 执行搜索
   * @param {string} keyword - 搜索关键词
   */
  performSearch(keyword) {
    this.searchKeyword = keyword.trim();
    this.currentPage = 1;
    this.refreshDisplay();

    // 更新搜索结果信息
    const resultInfoDiv = document.getElementById("search-result-info");
    if (resultInfoDiv) {
      if (this.searchKeyword) {
        resultInfoDiv.innerHTML = `搜索 "<strong>${this.escapeHtml(this.searchKeyword)}</strong>" 找到 ${this.currentExpandedRows.length} 条匹配`;
      } else {
        resultInfoDiv.innerHTML = "";
      }
    }
  }

  /**
   * 渲染表格当前页
   */
  renderTablePage() {
    if (!this.currentExpandedRows.length) {
      this.tbody.innerHTML = `<tr><td colspan="3">暂无数据</td></tr>`;
      this.paginationDiv.innerHTML = "";
      this.recordInfoSpan.innerText = "";
      return;
    }

    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    const end = start + this.PAGE_SIZE;
    const pageRows = this.currentExpandedRows.slice(start, end);

    let html = "";
    for (let idx = 0; idx < pageRows.length; idx++) {
      const row = pageRows[idx];
      const isGroupHeader =
        row[0] &&
        (row[0].includes("前缀相同的分析") || row[0].includes("自定义文件夹"));
      const rowClass = isGroupHeader ? "group-header" : "";
      const collapsedClass =
        isGroupHeader && row[0].includes("📂") ? "collapsed" : "";

      html += `<tr class="${rowClass} ${collapsedClass}" data-row-index="${start + idx}">`;
      for (let c = 0; c < row.length; c++) {
        html += `<td>${this.escapeHtmlWithHighlight(row[c] || "")}</td>`;
      }
      // 补全空列
      for (let c = row.length; c < 3; c++) {
        html += `<td></td>`;
      }
      html += `</tr>`;
    }
    this.tbody.innerHTML = html;

    // 绑定组标题点击事件
    this.bindGroupHeaderEvents();
  }

  /**
   * 绑定组标题点击事件
   */
  bindGroupHeaderEvents() {
    document.querySelectorAll(".group-header").forEach((headerRow) => {
      headerRow.addEventListener("click", (e) => {
        e.stopPropagation();
        const rowIdxAttr = headerRow.getAttribute("data-row-index");
        if (rowIdxAttr === null) return;

        const expandedIdx = parseInt(rowIdxAttr, 10);
        const targetGroup = this.findGroupByExpandedIndex(expandedIdx);

        if (targetGroup && targetGroup.type === "group") {
          targetGroup.collapsed = !targetGroup.collapsed;
          this.refreshDisplay();
        }
      });
    });
  }

  /**
   * 根据展开索引查找对应的组
   * @param {number} expandedIdx - 展开后的行索引
   * @returns {object|null} 组对象或null
   */
  findGroupByExpandedIndex(expandedIdx) {
    let acc = 0;
    for (const item of this.displayGroups) {
      if (item.type === "row") {
        if (acc === expandedIdx) return null;
        acc++;
      } else {
        if (acc === expandedIdx) return item;
        acc++; // 组标题行
        if (!item.collapsed) {
          acc += item.rows.length;
        }
        if (acc > expandedIdx) break;
      }
    }
    return null;
  }

  /**
   * 渲染分页控件
   */
  renderPagination() {
    if (!this.paginationDiv) return;

    if (this.totalPages <= 1) {
      this.paginationDiv.innerHTML = `<span>共 ${this.currentExpandedRows.length} 行</span>`;
      return;
    }

    let btnHtml = `<button class="page-btn" data-page="prev" ${this.currentPage === 1 ? "disabled" : ""}>上一页</button>`;

    // 显示最多7个页码按钮
    let startPage = Math.max(1, this.currentPage - 3);
    let endPage = Math.min(this.totalPages, this.currentPage + 3);
    if (endPage - startPage < 6) {
      if (startPage === 1) endPage = Math.min(this.totalPages, startPage + 6);
      else if (endPage === this.totalPages)
        startPage = Math.max(1, endPage - 6);
    }

    for (let p = startPage; p <= endPage; p++) {
      btnHtml += `<button class="page-btn ${p === this.currentPage ? "active" : ""}" data-page="${p}">${p}</button>`;
    }

    btnHtml += `<button class="page-btn" data-page="next" ${this.currentPage === this.totalPages ? "disabled" : ""}>下一页</button>`;
    btnHtml += `<span class="page-info">第 ${this.currentPage} / ${this.totalPages} 页 (共 ${this.currentExpandedRows.length} 行)</span>`;
    this.paginationDiv.innerHTML = btnHtml;

    // 绑定分页按钮事件
    this.paginationDiv.querySelectorAll(".page-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (btn.disabled) return;
        const page = btn.getAttribute("data-page");

        if (page === "prev" && this.currentPage > 1) this.currentPage--;
        else if (page === "next" && this.currentPage < this.totalPages)
          this.currentPage++;
        else if (!isNaN(parseInt(page))) this.currentPage = parseInt(page);
        else return;

        this.refreshDisplay();

        // 平滑滚动到表格顶部
        document
          .querySelector("table")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  /**
   * 更新记录统计信息
   */
  updateRecordInfo() {
    const originalCount = this.fullDataset.length;
    const expandedCount = this.currentExpandedRows.length;

    if (this.recordInfoSpan) {
      const searchInfo = this.searchKeyword
        ? ` | 搜索: "${this.escapeHtml(this.searchKeyword)}"`
        : "";
      this.recordInfoSpan.innerHTML = `📊 原始数据 ${originalCount} 条记录 | 当前视图 ${expandedCount} 行 (含分组标题) | 每页 ${this.PAGE_SIZE} 行${searchInfo}`;
    }
    if (this.htmldata) {
      this.htmldata.innerHTML = `📄 总记录数: ${originalCount}`;
    }
  }

  /**
   * 刷新显示（重新计算并渲染）
   */
  refreshDisplay() {
    this.currentExpandedRows = this.getExpandedRowsFromGroups();
    this.totalPages = Math.ceil(
      this.currentExpandedRows.length / this.PAGE_SIZE,
    );

    // 确保当前页有效
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }

    this.renderTablePage();
    this.renderPagination();
    this.updateRecordInfo();
  }

  /**
   * 显示错误信息
   * @param {string} message - 错误消息
   */
  showError(message) {
    this.tbody.innerHTML = `<tr><td colspan="3">加载失败: ${message}</td></tr>`;
    if (this.htmldata) this.htmldata.innerHTML = `加载失败`;
  }

  /**
   * 添加自定义文件夹（字符串范围选择）
   * @param {string} startStr - 起始字符串
   * @param {string} endStr - 结束字符串
   * @param {string} name - 文件夹名称（可选）
   */
  addCustomFolder(startStr, endStr, name = "") {
    const folder = {
      id: Date.now(),
      startStr: startStr.trim(),
      endStr: endStr.trim(),
      name: name.trim() || `文件夹 ${this.customFolders.length + 1}`,
    };

    this.customFolders.push(folder);
    this.buildDisplayGroups();
    this.currentPage = 1;
    this.refreshDisplay();

    // 更新文件夹列表UI
    this.renderCustomFolderPanel();
  }

  /**
   * 删除自定义文件夹
   * @param {number} folderId - 文件夹ID
   */
  removeCustomFolder(folderId) {
    this.customFolders = this.customFolders.filter((f) => f.id !== folderId);
    this.buildDisplayGroups();
    this.currentPage = 1;
    this.refreshDisplay();

    // 更新文件夹列表UI
    this.renderCustomFolderPanel();
  }

  /**
   * 渲染自定义文件夹控制面板
   */
  renderCustomFolderPanel() {
    const panelDiv = document.getElementById("folder-panel");
    if (!panelDiv) return;

    // 文件夹表单
    let html = `
      <div class="folder-panel">
        <h3>📁 创建文件夹（字符串范围选择）</h3>
        <div class="folder-form">
          <label>
            起始字符串:<br>
            <input type="text" id="folder-start" placeholder="输入起始字符串" size="30">
          </label>
          <label>
            结束字符串:<br>
            <input type="text" id="folder-end" placeholder="输入结束字符串" size="30">
          </label>
          <label>
            文件夹名称（可选）:<br>
            <input type="text" id="folder-name" placeholder="输入文件夹名称" size="30">
          </label>
          <button id="create-folder-btn">创建文件夹</button>
        </div>
        
        <div class="folder-list">
          <h4>已创建的文件夹:</h4>
          <ul>${
            this.customFolders.length
              ? this.customFolders
                  .map(
                    (f) => `
              <li>
                <span>${this.escapeHtml(f.name)}</span>
                <span class="folder-range">[${this.escapeHtml(f.startStr)} ~ ${this.escapeHtml(f.endStr)}]</span>
                <button class="remove-folder-btn" data-id="${f.id}">删除</button>
              </li>
            `,
                  )
                  .join("")
              : "<li>暂无文件夹</li>"
          }</ul>
        </div>
      </div>
    `;

    panelDiv.innerHTML = html;

    // 绑定创建按钮事件
    document
      .getElementById("create-folder-btn")
      .addEventListener("click", () => {
        const startStr = document.getElementById("folder-start").value;
        const endStr = document.getElementById("folder-end").value;
        const name = document.getElementById("folder-name").value;

        if (!startStr || !endStr) {
          alert("请输入起始和结束字符串");
          return;
        }

        this.addCustomFolder(startStr, endStr, name);

        // 清空输入
        document.getElementById("folder-start").value = "";
        document.getElementById("folder-end").value = "";
        document.getElementById("folder-name").value = "";
      });

    // 绑定删除按钮事件
    document.querySelectorAll(".remove-folder-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const folderId = parseInt(btn.getAttribute("data-id"));
        if (confirm("确定删除此文件夹吗？")) {
          this.removeCustomFolder(folderId);
        }
      });
    });
  }

  /**
   * 渲染侧边栏分析列表
   */
  renderSidebar() {
    const otherAnalysisDatas = [
      ["bhm", "Bashicu Hyper Matrix"],
      ["bm1", "Bashicu Matrix 1 (🎉)"],
      ["iblp", "Infinite Basic Laver Pattern"],
      ["pps4", "Parented Predecessor Sequence"],
      ["tbms", "Transfinite BMS"],
    ];

    const otheranalysis = document.getElementById("otheranalysis");
    if (otheranalysis) {
      otheranalysis.innerHTML = otherAnalysisDatas
        .map(
          (x) => `
          <li>
            <a href="?a=${encodeURIComponent(x[0])}">${this.escapeHtml(x[1])}</a>
            ${x[0] === this.readfile ? "(😀)" : ""}
          </li>
        `,
        )
        .join("");
    }
  }
}

// 启动应用
const viewer = new CSVViewer();

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
