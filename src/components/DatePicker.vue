<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: string
  visible: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:visible': [value: boolean]
}>()

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const viewYear = ref(0)
const viewMonth = ref(0)

const selectedDate = computed(() => {
  if (!props.modelValue) return null
  const parts = props.modelValue.split('-')
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
})

const today = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

function initView() {
  if (selectedDate.value) {
    viewYear.value = selectedDate.value.getFullYear()
    viewMonth.value = selectedDate.value.getMonth()
  } else {
    const d = new Date()
    viewYear.value = d.getFullYear()
    viewMonth.value = d.getMonth()
  }
}

const calendarDays = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1)
  const startDow = firstDay.getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const daysInPrevMonth = new Date(viewYear.value, viewMonth.value, 0).getDate()

  const days: { date: string; day: number; current: boolean; isToday: boolean; isSelected: boolean }[] = []

  for (let i = startDow - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const m = viewMonth.value === 0 ? 12 : viewMonth.value
    const y = viewMonth.value === 0 ? viewYear.value - 1 : viewYear.value
    days.push({
      date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      day: d,
      current: false,
      isToday: false,
      isSelected: false,
    })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      date: dateStr,
      day: d,
      current: true,
      isToday: dateStr === today.value,
      isSelected: dateStr === props.modelValue,
    })
  }

  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth.value + 2 > 12 ? 1 : viewMonth.value + 2
    const y = viewMonth.value + 2 > 12 ? viewYear.value + 1 : viewYear.value
    days.push({
      date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      day: d,
      current: false,
      isToday: false,
      isSelected: false,
    })
  }

  return days
})

const monthLabel = computed(() => {
  return `${viewYear.value}年${viewMonth.value + 1}月`
})

function prevMonth() {
  if (viewMonth.value === 0) {
    viewYear.value--
    viewMonth.value = 11
  } else {
    viewMonth.value--
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewYear.value++
    viewMonth.value = 0
  } else {
    viewMonth.value++
  }
}

function selectDay(date: string) {
  emit('update:modelValue', date)
  emit('update:visible', false)
}

function close() {
  emit('update:visible', false)
}

function open() {
  initView()
}

import { watch } from 'vue'
watch(() => props.visible, (v) => {
  if (v) initView()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="picker">
      <div v-if="visible" class="picker-overlay" @click.self="close">
        <div class="picker-card">
          <div class="picker-header">
            <button class="picker-nav" @click="prevMonth">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <span class="picker-month">{{ monthLabel }}</span>
            <button class="picker-nav" @click="nextMonth">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
            </button>
          </div>

          <div class="picker-weekdays">
            <span v-for="d in weekDays" :key="d" class="weekday">{{ d }}</span>
          </div>

          <div class="picker-grid">
            <button
              v-for="day in calendarDays"
              :key="day.date"
              :class="[
                'day-btn',
                { other: !day.current, today: day.isToday, selected: day.isSelected }
              ]"
              @click="selectDay(day.date)"
            >
              {{ day.day }}
            </button>
          </div>

          <div class="picker-footer">
            <button class="picker-today" @click="selectDay(today)">今天</button>
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
  width: 340px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.picker-nav {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--border-light);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.picker-nav:hover {
  background: var(--accent-bg);
  color: var(--accent);
}

.picker-month {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}

.picker-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 4px 0;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day-btn {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-btn:hover {
  background: var(--accent-bg);
}

.day-btn.other {
  color: var(--text-hint);
}

.day-btn.today {
  color: var(--accent);
  font-weight: 700;
}

.day-btn.selected {
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px var(--accent-glow);
}

.day-btn.selected:hover {
  background: var(--accent);
}

.picker-footer {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

.picker-today {
  padding: 8px 24px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: var(--accent);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.picker-today:hover {
  background: var(--accent-bg);
  border-color: var(--accent);
}

.picker-enter-active,
.picker-leave-active {
  transition: all 0.25s ease;
}

.picker-enter-from,
.picker-leave-to {
  opacity: 0;
}
</style>