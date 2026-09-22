<template>
  <div class="card" style="padding: 1.5rem;">
    <!-- Section Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
      <div>
        <h2 style="font-size: 1.1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
          Cron 表达式可视化与执行预测 (Cron Visualizer)
        </h2>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          支持 5 段（标准 Linux）与 6 段（Spring/Quartz）Cron 表达式，实时翻译成中文自然语言，并精准预测未来 5 次执行时刻。
        </p>
      </div>

      <div style="display: flex; gap: 0.5rem;">
        <button class="btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;" @click="setExpression('30 9 * * 1-5')">
          <Sparkles :size="14" />
          <span>常用工作日示例</span>
        </button>
      </div>
    </div>

    <!-- Quick Presets Carousel/Chips -->
    <div style="margin-bottom: 1.25rem;">
      <span style="font-size: 0.75rem; color: var(--text-dim); display: block; margin-bottom: 0.4rem;">常用快速预设：</span>
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
        <button 
          v-for="p in CRON_PRESETS" 
          :key="p.expr"
          class="btn-secondary"
          style="font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 6px;"
          @click="setExpression(p.expr)"
        >
          <span>{{ p.name }}</span>
          <code style="font-size: 0.7rem; color: var(--accent); margin-left: 0.3rem;">{{ p.expr }}</code>
        </button>
      </div>
    </div>

    <!-- Expression Input & Chinese Translation -->
    <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 10px; padding: 1.25rem; margin-bottom: 1.25rem;">
      <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem;">
        Cron 表达式输入
      </label>
      <div style="display: flex; gap: 0.75rem; align-items: center;">
        <input 
          type="text" 
          v-model="cronExpr" 
          class="input-field code-area" 
          style="font-size: 1.2rem; font-weight: 700; color: var(--accent); padding: 0.75rem 1rem;"
          placeholder="* * * * *" 
        />
        <button class="btn-primary" style="padding: 0.75rem 1.25rem; white-space: nowrap;" @click="copyExpr">
          <Check v-if="copied" :size="16" />
          <Copy v-else :size="16" />
          <span>{{ copied ? '已复制' : '复制表达式' }}</span>
        </button>
      </div>

      <!-- Human-Readable Translation Banner -->
      <div style="margin-top: 1rem; padding: 0.85rem 1rem; border-radius: 8px; background: var(--accent-light); border: 1px solid rgba(59, 130, 246, 0.25); display: flex; align-items: center; gap: 0.75rem;">
        <Clock :size="20" style="color: var(--accent); flex-shrink: 0;" />
        <div>
          <span style="font-size: 0.75rem; color: var(--text-dim); display: block;">中文语义解析：</span>
          <span style="font-size: 1rem; font-weight: 600; color: var(--text-main);">{{ humanExplanation }}</span>
        </div>
      </div>
    </div>

    <!-- Next 5 Executions List -->
    <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 10px; padding: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <h3 style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem;">
          <CalendarDays :size="16" />
          <span>未来 5 次执行时间预估</span>
        </h3>
        <span class="badge-tag">基于本地系统时区</span>
      </div>

      <div v-if="nextRuns.length > 0" style="display: flex; flex-direction: column; gap: 0.5rem;">
        <div 
          v-for="(dt, idx) in nextRuns" 
          :key="idx" 
          style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 1rem; border-radius: 6px; background: var(--bg-card); border: 1px solid var(--border-color);"
        >
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="width: 20px; height: 20px; border-radius: 50%; background: var(--accent-light); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700;">
              {{ idx + 1 }}
            </span>
            <span class="font-mono" style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">
              {{ formatRunTime(dt) }}
            </span>
          </div>

          <span style="font-size: 0.8rem; color: var(--text-muted);">
            {{ getRelativeTime(dt) }}
          </span>
        </div>
      </div>
      <div v-else style="color: var(--text-dim); font-size: 0.85rem; padding: 1rem; text-align: center;">
        未计算出后续执行时间，请检查表达式是否合法
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { CRON_PRESETS, explainCron, getNextExecutions } from '../utils/cronUtils';
import { Clock, CalendarDays, Copy, Check, Sparkles } from 'lucide-vue-next';

const cronExpr = ref('30 9 * * 1-5');
const copied = ref(false);

const humanExplanation = computed(() => explainCron(cronExpr.value));
const nextRuns = computed(() => getNextExecutions(cronExpr.value, 5));

function setExpression(expr) {
  cronExpr.value = expr;
}

function formatRunTime(d) {
  const pad = n => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  return `${y}-${m}-${day} ${h}:${min}:${s} (${weekDay})`;
}

function getRelativeTime(d) {
  const diffMs = d.getTime() - Date.now();
  if (diffMs < 0) return '即将执行';
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay} 天后`;
  if (diffHour > 0) return `${diffHour} 小时后`;
  if (diffMin > 0) return `${diffMin} 分钟后`;
  return `${diffSec} 秒后`;
}

function copyExpr() {
  navigator.clipboard.writeText(cronExpr.value).then(() => {
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  });
}
</script>
