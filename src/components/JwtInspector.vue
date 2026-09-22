<template>
  <div class="card" style="padding: 1.5rem;">
    <!-- Section Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
      <div>
        <h2 style="font-size: 1.1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
          JWT 纯离线透视与过期分析器 (JWT Inspector)
        </h2>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          100% 浏览器本地解析，绝不向任何第三方上传您的认证密钥。自动将时间戳（exp / iat）格式化为北京时间并计算剩余有效期。
        </p>
      </div>

      <div style="display: flex; gap: 0.5rem;">
        <button class="btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;" @click="loadDemoJwt">
          <Sparkles :size="14" />
          <span>填入示例 Token</span>
        </button>
        <button class="btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;" @click="clearAll">
          <Trash2 :size="14" />
          <span>清空</span>
        </button>
      </div>
    </div>

    <!-- Dual Panes: Input & Analysis -->
    <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.25rem;">
      <!-- Left: Raw JWT Input -->
      <div style="display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">
            输入: JWT 编码字符串
          </span>
          <span v-if="parseError" style="font-size: 0.75rem; color: #ef4444;">
            ⚠️ {{ parseError }}
          </span>
        </div>
        <textarea
          v-model="rawJwt"
          class="input-field code-area"
          style="height: 480px; resize: vertical; word-break: break-all;"
          placeholder="在此处粘贴 JWT Token (例如 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
          @input="handleParse"
        ></textarea>
      </div>

      <!-- Right: Decoded Result -->
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <!-- Status Banner -->
        <div 
          v-if="jwtData" 
          :style="{
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            border: '1px solid',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            backgroundColor: jwtData.isExpired ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            borderColor: jwtData.isExpired ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'
          }"
        >
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <AlertTriangle v-if="jwtData.isExpired" :size="18" style="color: #ef4444;" />
            <ShieldCheck v-else :size="18" style="color: #10b981;" />
            <div>
              <span :style="{ fontWeight: 600, fontSize: '0.9rem', color: jwtData.isExpired ? '#ef4444' : '#10b981' }">
                {{ jwtData.isExpired ? 'Token 已过期' : 'Token 有效' }}
              </span>
              <span v-if="jwtData.remainingText" style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.5rem;">
                ({{ jwtData.remainingText }})
              </span>
            </div>
          </div>

          <div style="font-size: 0.75rem; color: var(--text-dim);">
            <span v-if="jwtData.expDate">到期时间: {{ jwtData.expDate }}</span>
          </div>
        </div>

        <!-- Header Block -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <span style="font-size: 0.75rem; font-weight: 600; color: #f43f5e;">HEADER: 算法与类型</span>
            <span v-if="jwtData" class="badge-tag" style="color: #f43f5e;">{{ jwtData.header.alg || 'none' }}</span>
          </div>
          <textarea
            :value="headerFormatted"
            readonly
            class="input-field code-area"
            style="height: 110px; background: var(--code-bg); color: var(--code-output-header); font-weight: 500; resize: none;"
          ></textarea>
        </div>

        <!-- Payload Block -->
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <span style="font-size: 0.75rem; font-weight: 600; color: #a855f7;">PAYLOAD: 载荷数据</span>
            <button class="btn-secondary" style="font-size: 0.7rem; padding: 0.2rem 0.5rem;" :disabled="!payloadFormatted" @click="copyPayload">
              <Check v-if="copied" :size="12" />
              <Copy v-else :size="12" />
              <span>{{ copied ? '已复制' : '复制 Payload' }}</span>
            </button>
          </div>
          <textarea
            :value="payloadFormatted"
            readonly
            class="input-field code-area"
            style="height: 240px; background: var(--code-bg); color: var(--code-output-jwt); font-weight: 500; resize: vertical;"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { parseJwt } from '../utils/jwtUtils';
import { Sparkles, Trash2, Copy, Check, ShieldCheck, AlertTriangle } from 'lucide-vue-next';

const rawJwt = ref('');
const jwtData = ref(null);
const parseError = ref('');
const copied = ref(false);

const headerFormatted = computed(() => {
  if (!jwtData.value) return '';
  return JSON.stringify(jwtData.value.header, null, 2);
});

const payloadFormatted = computed(() => {
  if (!jwtData.value) return '';
  return JSON.stringify(jwtData.value.payload, null, 2);
});

function handleParse() {
  if (!rawJwt.value.trim()) {
    jwtData.value = null;
    parseError.value = '';
    return;
  }

  try {
    jwtData.value = parseJwt(rawJwt.value);
    parseError.value = '';
  } catch (err) {
    jwtData.value = null;
    parseError.value = err.message;
  }
}

function loadDemoJwt() {
  // Demo JWT expiring in 7 days from now
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 7 * 24 * 3600;

  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: "user_10086",
    name: "Chen Jinglong",
    role: "admin",
    permissions: ["system:user:query", "system:user:export", "data:privacy:view"],
    iat: now,
    exp: exp,
    iss: "auth.devprivacy.internal"
  };

  const b64 = obj => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signature = "c2lnbmF0dXJlX2RlbW9fb2ZmbGluZQ";

  rawJwt.value = `${b64(header)}.${b64(payload)}.${signature}`;
  handleParse();
}

function clearAll() {
  rawJwt.value = '';
  jwtData.value = null;
  parseError.value = '';
}

function copyPayload() {
  if (!payloadFormatted.value) return;
  navigator.clipboard.writeText(payloadFormatted.value).then(() => {
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  });
}

onMounted(() => {
  loadDemoJwt();
});
</script>
