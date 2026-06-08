<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps<{
  modelValue: string
  visible: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:visible': [value: boolean]
}>()

const mode = ref<'hour' | 'minute'>('hour')
const dialRef = ref<HTMLElement | null>(null)
const editing = ref(false)
const editValue = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

const hours = computed(() => props.modelValue ? parseInt(props.modelValue.split(':')[0]) % 24 : 0)
const minutes = computed(() => props.modelValue ? parseInt(props.modelValue.split(':')[1]) : 0)

const displayHour = computed(() => {
  const h = hours.value
  if (h === 0) return 12
  if (h > 12) return h - 12
  return h
})

const isPM = computed(() => hours.value >= 12)

const displayValue = computed(() => {
  return `${String(hours.value).padStart(2, '0')}:${String(minutes.value).padStart(2, '0')}`
})

function startEditing() {
  editValue.value = displayValue.value
  editing.value = true
  nextTick(() => {
    editInputRef.value?.focus()
    editInputRef.value?.select()
  })
}

function onEditInput(e: Event) {
  const input = e.target as HTMLInputElement
  let val = input.value.replace(/[^0-9]/g, '').slice(0, 4)
  if (val.length >= 3) {
    val = val.slice(0, 2) + ':' + val.slice(2)
  }
  editValue.value = val
}

function normTime(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, '')
  if (digits.length < 3) return null
  let h = parseInt(digits.slice(0, 2))
  let m = parseInt(digits.slice(2, 4))
  if (isNaN(h) || isNaN(m)) return null
  if (h >= 24) h = 23
  if (m >= 60) m = 59
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function confirmEdit() {
  const trimmed = editValue.value.trim()
  const time = normTime(trimmed)
  if (time) {
    emit('update:modelValue', time)
  }
  editing.value = false
}

function cancelEdit() {
  editing.value = false
}

function selectHour(h: number) {
  let realH = h
  if (isPM.value && h !== 12) realH = h + 12
  if (!isPM.value && h === 12) realH = 0
  emit('update:modelValue', `${String(realH).padStart(2, '0')}:${String(minutes.value).padStart(2, '0')}`)
  mode.value = 'minute'
}

function selectMinute(m: number) {
  emit('update:modelValue', `${String(hours.value).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
}

function toggleAmPm() {
  let realH = hours.value
  if (isPM.value) {
    realH = realH - 12
  } else {
    realH = realH + 12
  }
  if (realH === 24) realH = 0
  emit('update:modelValue', `${String(realH).padStart(2, '0')}:${String(minutes.value).padStart(2, '0')}`)
}

function confirm() {
  emit('update:visible', false)
}

function close() {
  editing.value = false
  emit('update:visible', false)
}

watch(() => props.visible, (v) => {
  if (v) {
    mode.value = 'hour'
    editing.value = false
  }
})

const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
</script>

<template>
  <Teleport to="body">
    <Transition name="picker">
      <div v-if="visible" class="picker-overlay" @click.self="close">
        <div class="picker-card">
          <div class="picker-display" @click="startEditing">
            <input
              v-if="editing"
              ref="editInputRef"
              :value="editValue"
              class="picker-edit-input"
              placeholder="HHMM"
              @input="onEditInput"
              @keyup.enter="confirmEdit"
              @blur="confirmEdit"
              @keyup.escape="cancelEdit"
            />
            <span v-else class="picker-time">{{ displayValue }}</span>
            <span v-if="!editing" class="picker-edit-hint">点击编辑</span>
          </div>

          <div class="picker-tab">
            <button :class="['picker-tab-btn', { active: mode === 'hour' }]" @click="mode = 'hour'">时</button>
            <button :class="['picker-tab-btn', { active: mode === 'minute' }]" @click="mode = 'minute'">分</button>
          </div>

          <div class="dial-container" ref="dialRef">
            <div class="dial">
              <button
                v-for="(n, i) in mode === 'hour' ? hourNumbers : minuteNumbers"
                :key="n"
                :class="['dial-number', { selected: mode === 'hour' ? displayHour === n : minutes === n }]"
                :style="{ transform: `rotate(${i * 30}deg) translateY(-88px) rotate(-${i * 30}deg)` }"
                @click="mode === 'hour' ? selectHour(n) : selectMinute(n)"
              >
                {{ mode === 'hour' ? n : String(n).padStart(2, '0') }}
              </button>
            </div>
            <div class="dial-center"></div>
          </div>

          <div class="picker-actions">
            <button class="ampm-btn" @click="toggleAmPm">{{ isPM ? 'PM' : 'AM' }}</button>
            <div class="picker-actions-right">
              <button class="picker-cancel" @click="close">取消</button>
              <button class="picker-confirm" @click="confirm">确定</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.picker-card {
  background: #fff;
  border-radius: 24px;
  width: 320px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.picker-display {
  background: linear-gradient(135deg, var(--accent), var(--accent-purple));
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
  cursor: pointer;
  position: relative;
  transition: opacity 0.15s;
}

.picker-display:hover {
  opacity: 0.9;
}

.picker-time {
  font-size: 42px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 2px;
  font-variant-numeric: tabular-nums;
}

.picker-edit-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  outline: none;
  font-family: inherit;
  letter-spacing: 2px;
  font-variant-numeric: tabular-nums;
}

.picker-edit-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.picker-edit-hint {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.5px;
}

.picker-tab {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: var(--border-light);
  border-radius: 10px;
  padding: 3px;
}

.picker-tab-btn {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.picker-tab-btn.active {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 2px 8px var(--accent-glow);
}

.dial-container {
  position: relative;
  width: 240px;
  height: 240px;
  margin: 0 auto 20px;
}

.dial {
  position: absolute;
  inset: 0;
}

.dial-number {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 36px;
  height: 36px;
  margin-left: -18px;
  margin-top: -18px;
  border-radius: 50%;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  transition: all 0.15s;
}

.dial-number:hover {
  background: var(--accent-bg);
  color: var(--accent);
}

.dial-number.selected {
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px var(--accent-glow);
}

.dial-center {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  margin-left: -4px;
  margin-top: -4px;
  border-radius: 50%;
  background: var(--accent);
}

.picker-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.picker-actions-right {
  display: flex;
  gap: 10px;
}

.ampm-btn {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #fff;
  font-size: 14px;
  font-weight: 700;
  color: var(--accent);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.ampm-btn:hover {
  background: var(--accent-bg);
}

.picker-cancel {
  padding: 8px 20px;
  border-radius: 10px;
  border: none;
  background: var(--border-light);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.picker-cancel:hover {
  background: var(--border);
}

.picker-confirm {
  padding: 8px 20px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent-purple));
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.picker-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--accent-glow);
}

.picker-enter-active,
.picker-leave-active {
  transition: all 0.25s ease;
}

.picker-enter-from,
.picker-leave-to {
  opacity: 0;
}

.picker-enter-from .picker-card,
.picker-leave-to .picker-card {
  transform: scale(0.95);
}
</style>
