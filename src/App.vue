<template>
  <div class="app-container">
    <Navbar 
      :current-tab="activeTab" 
      :is-dark="isDark"
      @select-tab="activeTab = $event"
      @toggle-theme="toggleTheme"
    />

    <main>
      <KeepAlive>
        <component :is="activeComponent" />
      </KeepAlive>
    </main>

    <footer style="margin-top: 3rem; text-align: center; color: var(--text-dim); font-size: 0.8rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
      <p style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; flex-wrap: wrap;">
        <span>🔒 100% Client-Side. No telemetry, no logs, no external servers.</span>
        <span>·</span>
        <span>Open Source under MIT License</span>
      </p>
      <p style="margin-top: 0.35rem;">
        DevPrivacyBox — 属于开发者的纯本地数据与开发瑞士军刀
      </p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Navbar from './components/Navbar.vue';
import ExcelToSql from './components/ExcelToSql.vue';
import JsonToEntity from './components/JsonToEntity.vue';
import DataMasker from './components/DataMasker.vue';

const activeTab = ref('excel-to-sql');
const isDark = ref(true);

const activeComponent = computed(() => {
  switch (activeTab.value) {
    case 'excel-to-sql': return ExcelToSql;
    case 'json-to-entity': return JsonToEntity;
    case 'data-masker': return DataMasker;
    default: return ExcelToSql;
  }
});

function toggleTheme() {
  isDark.value = !isDark.value;
  applyTheme();
}

function applyTheme() {
  if (isDark.value) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    isDark.value = false;
  }
  applyTheme();
});
</script>
