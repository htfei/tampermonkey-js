// ==UserScript==
// @name         [tools]⚙️网页table表格高亮纯数字最大值，用于AI大模型分数对比
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  高亮每行中纯数字的最大值 <td>
// @author       dad
// @match        *://*/*
// @grant        none
// @icon         http://iciba.com/favicon.ico
// ==/UserScript==

(function() {
  'use strict';

  function isPureNumber(text) {
    return /^-?\d+(\.\d+)?$/.test(text.trim());
  }

  function highlightMaxPureNumericCells() {
    document.querySelectorAll('table').forEach(table => {
      table.querySelectorAll('tr').forEach(row => {
        const tds = Array.from(row.querySelectorAll('td'));
        const pureNumbers = tds.map(td => {
          const txt = td.textContent.trim();
          return isPureNumber(txt) ? parseFloat(txt) : null;
        });

        const valid = pureNumbers.filter(val => val !== null);
        if (valid.length === 0) return;

        const maxValue = Math.max(...valid);

        tds.forEach((td, i) => {
          if (pureNumbers[i] === maxValue) {
            td.style.color = 'red';
            td.style.fontWeight = 'bold';
          }
        });
      });
    });
  }

  function observeChanges() {
    const observer = new MutationObserver(() => highlightMaxPureNumericCells());
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('load', () => setTimeout(highlightMaxPureNumericCells, 500));
  }

  observeChanges();
})();
