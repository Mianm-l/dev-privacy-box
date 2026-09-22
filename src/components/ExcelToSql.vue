<template>
  <div class="card" style="padding: 1.5rem;">
    <!-- Section Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
      <div>
        <h2 style="font-size: 1.1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
          Excel / CSV ➔ 批量 SQL 生成器
        </h2>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          直接从 Excel 或 WPS 复制多行单元格粘贴在此，自动推断字段类型并生成支持分批（Batch Insert）的高性能 SQL。
        </p>
      </div>

      <div style="display: flex; gap: 0.5rem;">
        <button class="btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;" @click="loadDemoData">
          <Sparkles :size="14" />
          <span>填入示例数据</span>
        </button>
        <button class="btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;" @click="clearAll">
          <Trash2 :size="14" />
          <span>清空</span>
        </button>
      </div>
    </div>

    <!-- Options Toolbar -->
    <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1.25rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; align-items: center;">
      <div>
        <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.3rem;">目标数据表名</label>
        <input type="text" v-model="tableName" class="input-field" placeholder="例如: sys_user" />
      </div>

      <div>
        <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.3rem;">插入模式</label>
        <select v-model="insertMode" class="input-field" style="cursor: pointer;">
          <option value="INSERT INTO">INSERT INTO (标准插入)</option>
          <option value="INSERT IGNORE INTO">INSERT IGNORE INTO (忽略主键冲突)</option>
          <option value="REPLACE INTO">REPLACE INTO (冲突覆盖)</option>
        </select>
      </div>

      <div>
        <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.3rem;">每批条数 (Batch Size)</label>
        <select v-model.number="batchSize" class="input-field" style="cursor: pointer;">
          <option :value="100">100 条 / 批</option>
          <option :value="500">500 条 / 批 (推荐)</option>
          <option :value="1000">1000 条 / 批</option>
          <option :value="2000">2000 条 / 批</option>
        </select>
      </div>

      <div style="display: flex; align-items: center; gap: 0.6rem; padding-top: 1.2rem;">
        <input type="checkbox" id="genDdl" v-model="generateDdl" style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--accent);" />
        <label for="genDdl" style="font-size: 0.85rem; cursor: pointer; user-select: none;">附带生成建表 DDL</label>
      </div>
    </div>

    <!-- Dual Panes: Input & Output -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
      <!-- Left: Raw Input -->
      <div style="display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">
            输入: 表格粘贴文本 / CSV
          </span>
          <span v-if="parsedStats.rows > 0" class="badge-tag">
            {{ parsedStats.rows }} 行 · {{ parsedStats.cols }} 列
          </span>
        </div>
        <textarea
          v-model="rawInput"
          class="input-field code-area"
          style="height: 480px; resize: vertical;"
          placeholder="从 Excel/CSV 直接复制多行多列粘贴在此处...&#10;首行将被自动识别为列字段名"
          @input="handleGenerate"
        ></textarea>
      </div>

      <!-- Right: Generated SQL -->
      <div style="display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">
            输出: 优化后 SQL 脚本
          </span>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn-secondary" style="font-size: 0.75rem; padding: 0.25rem 0.6rem;" :disabled="!sqlOutput" @click="downloadSql">
              <Download :size="13" />
              <span>下载 .sql</span>
            </button>
            <button class="btn-primary" style="font-size: 0.75rem; padding: 0.25rem 0.65rem;" :disabled="!sqlOutput" @click="copySql">
              <Check v-if="copied" :size="13" />
              <Copy v-else :size="13" />
              <span>{{ copied ? '已复制' : '一键复制' }}</span>
            </button>
          </div>
        </div>
        <textarea
          v-model="sqlOutput"
          readonly
          class="input-field code-area"
          style="height: 480px; resize: vertical; background: var(--code-bg); color: #38bdf8;"
          placeholder="生成的 SQL 语句将显示在这里..."
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { parseTableData, generateSql } from '../utils/sqlGenerator';
import { Sparkles, Trash2, Copy, Check, Download } from 'lucide-vue-next';

const rawInput = ref('');
const tableName = ref('sys_user');
const insertMode = ref('INSERT INTO');
const batchSize = ref(500);
const generateDdl = ref(true);
const sqlOutput = ref('');
const copied = ref(false);
const parsedStats = ref({ rows: 0, cols: 0 });

function handleGenerate() {
  if (!rawInput.value.trim()) {
    sqlOutput.value = '';
    parsedStats.value = { rows: 0, cols: 0 };
    return;
  }

  const { headers, rows } = parseTableData(rawInput.value);
  parsedStats.value = {
    rows: rows.length,
    cols: headers.length
  };

  if (headers.length === 0 || rows.length === 0) {
    sqlOutput.value = '-- 未检测到有效的数据行，请检查粘贴格式';
    return;
  }

  sqlOutput.value = generateSql({
    headers,
    rows,
    tableName: tableName.value.trim() || 'my_table',
    mode: insertMode.value,
    batchSize: batchSize.value,
    quoteChar: '`',
    generateDdl: generateDdl.value
  });
}

watch([tableName, insertMode, batchSize, generateDdl], () => {
  handleGenerate();
});

function loadDemoData() {
  rawInput.value = [
    'user_id\tuser_name\tmobile\tdepartment\tsalary\tis_active\tjoin_date',
    '10001\t张伟\t13800138000\t研发部\t18500.50\ttrue\t2023-03-15',
    '10002\t李娜\t13912345678\t市场部\t14200.00\ttrue\t2023-05-20',
    '10003\t王强\t15088889999\t运营部\t12000.00\tfalse\t2022-11-01',
    '10004\t赵敏\t18666667777\t财务部\t16800.00\ttrue\t2024-01-10',
    '10005\t孙杰\t17700001111\t技术支持\t9800.00\ttrue\t2024-02-18'
  ].join('\n');
  handleGenerate();
}

function clearAll() {
  rawInput.value = '';
  sqlOutput.value = '';
  parsedStats.value = { rows: 0, cols: 0 };
}

function copySql() {
  if (!sqlOutput.value) return;
  navigator.clipboard.writeText(sqlOutput.value).then(() => {
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  });
}

function downloadSql() {
  if (!sqlOutput.value) return;
  const blob = new Blob([sqlOutput.value], { type: 'text/sql;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${tableName.value || 'export'}_insert.sql`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

onMounted(() => {
  loadDemoData();
});
</script>
