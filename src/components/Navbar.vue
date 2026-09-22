<template>
  <header class="card" style="margin-bottom: 1.5rem; padding: 1rem 1.5rem;">
    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
      <!-- Logo & Security Badge -->
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
            <ShieldCheck :size="22" />
          </div>
          <div>
            <h1 style="font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; display: flex; align-items: center; gap: 0.5rem;">
              DevPrivacyBox
              <span style="font-size: 0.75rem; font-weight: 600; padding: 0.15rem 0.45rem; border-radius: 4px; background: var(--accent-light); color: var(--accent); border: 1px solid var(--accent);">v1.0</span>
            </h1>
            <p style="font-size: 0.8rem; color: var(--text-muted);">100% 浏览器本地运行 · 零数据外发 · 离线可用</p>
          </div>
        </div>

        <div class="badge-security" title="代码完全在您的浏览器本地执行，无任何服务端数据收集">
          <Lock :size="13" />
          <span>绝对隐私保护</span>
        </div>
      </div>

      <!-- Theme Toggle & GitHub -->
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <button class="btn-icon" @click="$emit('toggle-theme')" :title="isDark ? '切换至亮色模式' : '切换至暗色模式'">
          <Sun v-if="isDark" :size="18" />
          <Moon v-else :size="18" />
        </button>

        <a 
          href="https://github.com" 
          target="_blank" 
          class="btn-secondary" 
          style="text-decoration: none; padding: 0.45rem 0.85rem; font-size: 0.8rem;"
        >
          <Github :size="16" />
          <span>Star on GitHub</span>
        </a>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <nav style="display: flex; gap: 0.5rem; margin-top: 1.25rem; border-top: 1px solid var(--border-color); padding-top: 1rem; overflow-x: auto;">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="$emit('select-tab', tab.id)"
        :class="['btn-secondary', { 'active-tab': currentTab === tab.id }]"
        style="font-size: 0.85rem; padding: 0.5rem 1rem;"
      >
        <component :is="tab.icon" :size="16" />
        <span>{{ tab.name }}</span>
      </button>
    </nav>
  </header>
</template>

<script setup>
import { 
  ShieldCheck, 
  Lock, 
  Sun, 
  Moon, 
  Github, 
  Database, 
  FileCode2, 
  EyeOff 
} from 'lucide-vue-next';

defineProps({
  currentTab: { type: String, required: true },
  isDark: { type: Boolean, default: true }
});

defineEmits(['select-tab', 'toggle-theme']);

const tabs = [
  { id: 'excel-to-sql', name: 'Excel / CSV ➔ 批量 SQL', icon: Database },
  { id: 'json-to-entity', name: 'JSON ➔ Java / TS 实体', icon: FileCode2 },
  { id: 'data-masker', name: '敏感数据批量脱敏', icon: EyeOff }
];
</script>

<style scoped>
.active-tab {
  background-color: var(--accent) !important;
  color: #ffffff !important;
  border-color: var(--accent) !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
}
</style>
