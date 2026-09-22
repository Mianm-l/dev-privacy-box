<template>
  <div class="card" style="padding: 1.5rem;">
    <!-- Section Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
      <div>
        <h2 style="font-size: 1.1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
          生产敏感数据批量脱敏助手 (Data Masker)
        </h2>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          排查生产问题或将日志转给外部排查时，一键批量脱敏手机号、身份证、邮箱、银行卡号与 IP 地址，确保零敏感信息外泄。
        </p>
      </div>

      <div style="display: flex; gap: 0.5rem;">
        <button class="btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;" @click="loadDemoLogs">
          <Sparkles :size="14" />
          <span>填入示例日志</span>
        </button>
        <button class="btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;" @click="clearAll">
          <Trash2 :size="14" />
          <span>清空</span>
        </button>
      </div>
    </div>

    <!-- Rule Toggles -->
    <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1.25rem; display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center;">
      <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer;">
        <input type="checkbox" v-model="maskPhone" style="accent-color: var(--accent);" />
        <span>手机号码 (138****1234)</span>
      </label>

      <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer;">
        <input type="checkbox" v-model="maskIdCard" style="accent-color: var(--accent);" />
        <span>18位身份证号</span>
      </label>

      <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer;">
        <input type="checkbox" v-model="maskEmail" style="accent-color: var(--accent);" />
        <span>电子邮箱 (u****r@dom.com)</span>
      </label>

      <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer;">
        <input type="checkbox" v-model="maskBankCard" style="accent-color: var(--accent);" />
        <span>银行卡号 (6222******8888)</span>
      </label>

      <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer;">
        <input type="checkbox" v-model="maskIp" style="accent-color: var(--accent);" />
        <span>IPv4 地址 (192.168.*.*)</span>
      </label>
    </div>

    <!-- Dual Panes: Input & Output -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
      <!-- Left: Raw Input -->
      <div style="display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">
            输入: 包含敏感信息的文本 / 日志 / JSON
          </span>
          <span v-if="rawText" class="badge-tag">
            {{ rawText.length }} 字符
          </span>
        </div>
        <textarea
          v-model="rawText"
          class="input-field code-area"
          style="height: 480px; resize: vertical;"
          placeholder="在此处粘贴包含手机号、身份证、邮箱等敏感数据的任意文本..."
          @input="handleMask"
        ></textarea>
      </div>

      <!-- Right: Masked Result -->
      <div style="display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">
            输出: 安全脱敏文本
          </span>
          <button class="btn-primary" style="font-size: 0.75rem; padding: 0.25rem 0.65rem;" :disabled="!maskedText" @click="copyMasked">
            <Check v-if="copied" :size="13" />
            <Copy v-else :size="13" />
            <span>{{ copied ? '已复制' : '复制脱敏结果' }}</span>
          </button>
        </div>
        <textarea
          v-model="maskedText"
          readonly
          class="input-field code-area"
          style="height: 480px; resize: vertical; background: var(--code-bg); color: var(--code-output-masked); font-weight: 500;"
          placeholder="脱敏后的安全内容将实时显示在此处..."
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { maskText } from '../utils/maskUtils';
import { Sparkles, Trash2, Copy, Check } from 'lucide-vue-next';

const rawText = ref('');
const maskedText = ref('');
const copied = ref(false);

const maskPhone = ref(true);
const maskIdCard = ref(true);
const maskEmail = ref(true);
const maskBankCard = ref(true);
const maskIp = ref(true);

function handleMask() {
  if (!rawText.value) {
    maskedText.value = '';
    return;
  }
  maskedText.value = maskText(rawText.value, {
    maskPhone: maskPhone.value,
    maskIdCard: maskIdCard.value,
    maskEmail: maskEmail.value,
    maskBankCard: maskBankCard.value,
    maskIp: maskIp.value
  });
}

watch([maskPhone, maskIdCard, maskEmail, maskBankCard, maskIp], () => {
  handleMask();
});

function loadDemoLogs() {
  rawText.value = [
    '2026-09-22 14:22:15.892 [INFO] [OrderService] - Processing user payment order: ORD-9921',
    'User mobile: 13800138000, ID Card: 110101199003072391, Email: customer.support@company.com',
    'Payment card: 6222020200119988776, Client Request IP: 192.168.10.154',
    'Emergency contact: 15912345678, verified with identity 44010219881215002X',
    'Notification sent to admin.alert@enterprise.internal successfully.'
  ].join('\n');
  handleMask();
}

function clearAll() {
  rawText.value = '';
  maskedText.value = '';
}

function copyMasked() {
  if (!maskedText.value) return;
  navigator.clipboard.writeText(maskedText.value).then(() => {
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  });
}

onMounted(() => {
  loadDemoLogs();
});
</script>
