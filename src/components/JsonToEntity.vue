<template>
  <div class="card" style="padding: 1.5rem;">
    <!-- Section Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
      <div>
        <h2 style="font-size: 1.1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
          JSON ➔ Java Entity / TypeScript 接口生成器
        </h2>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          将接口返回的 JSON 响应或载荷粘贴在此，自动推断类型并生成符合开发规范的 Java DTO 类与 TypeScript 类型定义。
        </p>
      </div>

      <div style="display: flex; gap: 0.5rem;">
        <button class="btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;" @click="loadDemoJson">
          <Sparkles :size="14" />
          <span>填入示例 JSON</span>
        </button>
        <button class="btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;" @click="clearAll">
          <Trash2 :size="14" />
          <span>清空</span>
        </button>
      </div>
    </div>

    <!-- Options Toolbar -->
    <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1.25rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;">
      <div style="flex: 1; min-width: 180px;">
        <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.3rem;">类名 / 接口名</label>
        <input type="text" v-model="targetName" class="input-field" placeholder="例如: UserProfileDTO" />
      </div>

      <div v-if="targetLang === 'java'" style="flex: 1; min-width: 220px;">
        <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.3rem;">Java Package 包路径</label>
        <input type="text" v-model="packageName" class="input-field" placeholder="com.company.project.dto" />
      </div>

      <div v-if="targetLang === 'java'" style="display: flex; align-items: center; gap: 1rem; padding-top: 1.2rem;">
        <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer;">
          <input type="checkbox" v-model="useLombok" style="accent-color: var(--accent);" />
          <span>Lombok 注解</span>
        </label>
        <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer;">
          <input type="checkbox" v-model="useJackson" style="accent-color: var(--accent);" />
          <span>@JsonProperty 映射</span>
        </label>
      </div>
    </div>

    <!-- Dual Panes: Input & Output -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
      <!-- Left: Raw JSON Input -->
      <div style="display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">
            输入: JSON 文本
          </span>
          <span v-if="parseError" style="font-size: 0.75rem; color: #ef4444;">
            ⚠️ {{ parseError }}
          </span>
        </div>
        <textarea
          v-model="rawJson"
          class="input-field code-area"
          style="height: 500px; resize: vertical;"
          placeholder="在此处粘贴任意 JSON 对象或数组..."
          @input="handleConvert"
        ></textarea>
      </div>

      <!-- Right: Generated Code with Language Switch -->
      <div style="display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <!-- Lang Selector -->
          <div style="display: flex; gap: 0.25rem; background: var(--bg-input); padding: 0.2rem; border-radius: 6px; border: 1px solid var(--border-color);">
            <button 
              @click="targetLang = 'java'" 
              :class="['btn-secondary', { 'active-lang': targetLang === 'java' }]"
              style="padding: 0.2rem 0.65rem; font-size: 0.75rem; border: none; border-radius: 4px;"
            >
              Java (Lombok/POJO)
            </button>
            <button 
              @click="targetLang = 'ts'" 
              :class="['btn-secondary', { 'active-lang': targetLang === 'ts' }]"
              style="padding: 0.2rem 0.65rem; font-size: 0.75rem; border: none; border-radius: 4px;"
            >
              TypeScript Interface
            </button>
          </div>

          <button class="btn-primary" style="font-size: 0.75rem; padding: 0.25rem 0.65rem;" :disabled="!codeOutput" @click="copyCode">
            <Check v-if="copied" :size="13" />
            <Copy v-else :size="13" />
            <span>{{ copied ? '已复制' : '复制代码' }}</span>
          </button>
        </div>

        <textarea
          v-model="codeOutput"
          readonly
          class="input-field code-area"
          style="height: 500px; resize: vertical; background: var(--code-bg); color: var(--code-output-java); font-weight: 500;"
          placeholder="生成的实体类代码将显示在此处..."
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { parseJson, generateJavaEntity, generateTsInterface } from '../utils/entityGenerator';
import { Sparkles, Trash2, Copy, Check } from 'lucide-vue-next';

const rawJson = ref('');
const targetName = ref('UserProfileDTO');
const packageName = ref('com.company.api.dto');
const targetLang = ref('java');
const useLombok = ref(true);
const useJackson = ref(true);

const codeOutput = ref('');
const parseError = ref('');
const copied = ref(false);

function handleConvert() {
  if (!rawJson.value.trim()) {
    codeOutput.value = '';
    parseError.value = '';
    return;
  }

  try {
    const obj = parseJson(rawJson.value);
    parseError.value = '';

    if (targetLang.value === 'java') {
      codeOutput.value = generateJavaEntity(obj, targetName.value.trim() || 'DemoDTO', {
        useLombok: useLombok.value,
        useJackson: useJackson.value,
        packageName: packageName.value.trim() || 'com.example.dto'
      });
    } else {
      codeOutput.value = generateTsInterface(obj, targetName.value.trim() || 'DemoData');
    }
  } catch (err) {
    parseError.value = err.message;
  }
}

watch([targetName, packageName, targetLang, useLombok, useJackson], () => {
  handleConvert();
});

function loadDemoJson() {
  const demoObj = {
    order_id: "ORD-2026-99881",
    user_id: 10086,
    total_amount: 599.90,
    is_paid: true,
    created_at: "2026-09-22T14:30:00",
    shipping_address: {
      recipient: "张三",
      mobile: "13800138000",
      city: "北京市",
      detail: "海淀区中关村大街1号"
    },
    items: [
      { sku_code: "SKU-001", title: "降噪无线蓝牙耳机", unit_price: 299.95, quantity: 2 }
    ]
  };
  rawJson.value = JSON.stringify(demoObj, null, 2);
  handleConvert();
}

function clearAll() {
  rawJson.value = '';
  codeOutput.value = '';
  parseError.value = '';
}

function copyCode() {
  if (!codeOutput.value) return;
  navigator.clipboard.writeText(codeOutput.value).then(() => {
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  });
}

onMounted(() => {
  loadDemoJson();
});
</script>

<style scoped>
.active-lang {
  background: var(--accent) !important;
  color: white !important;
}
</style>
