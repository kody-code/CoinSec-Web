<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAccounts } from '@/api/account'
import { getRecords, getStatistics } from '@/api/record'
import { formatMoney, formatDate, formatDateGroup } from '@/utils/format'
import StatCard from '@/components/StatCard.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import EmptyState from '@/components/EmptyState.vue'
import AccountIcon from '@/components/AccountIcon.vue'
import type { Account, RecordItem, Statistics } from '@/types'

const router = useRouter()

const accounts = ref<Account[]>([])
const recentRecords = ref<RecordItem[]>([])
const stats = ref<Statistics | null>(null)
const loading = ref(true)

const groupedRecords = computed(() => {
  const groups: { date: string; items: RecordItem[] }[] = []
  let lastDate = ''
  for (const r of recentRecords.value) {
    const date = formatDateGroup(r.recordTime)
    if (date !== lastDate) {
      groups.push({ date, items: [] })
      lastDate = date
    }
    groups[groups.length - 1].items.push(r)
  }
  return groups
})

onMounted(async () => {
  try {
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const today = now.toISOString().slice(0, 10)

    const [acctRes, recRes, statRes] = await Promise.all([
      getAccounts(),
      getRecords({ page: 1, size: 10 }),
      getStatistics(monthStart, today),
    ])
    accounts.value = acctRes.data.data
    recentRecords.value = recRes.data.data.content
    stats.value = statRes.data.data
  } catch {
    // 401 handled by interceptor redirect
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="dashboard">
    <div class="stat-grid">
      <StatCard label="本月收入" :value="stats ? formatMoney(stats.totalIncome) : '—'" icon="up" variant="income" />
      <StatCard label="本月支出" :value="stats ? formatMoney(stats.totalExpense) : '—'" icon="down" variant="expense" />
      <StatCard label="结余" :value="stats ? formatMoney(stats.totalIncome - stats.totalExpense) : '—'" icon="balance" variant="balance" />
    </div>

    <div v-if="loading" class="loading-wrap">
      <LoadingSkeleton :rows="2" />
    </div>

    <template v-else>
      <div class="section-card" v-if="accounts.length > 0">
        <div class="section-header">
          <h3>账户概览</h3>
          <button class="section-more" @click="router.push('/accounts')">管理 →</button>
        </div>
        <div class="account-grid">
          <div
            v-for="acct in accounts"
            :key="acct.accountId"
            class="account-card"
            @click="router.push('/accounts/' + acct.accountId)"
          >
            <div class="acct-avatar">
              <AccountIcon :icon="acct.icon || 'wallet'" :size="22" />
            </div>
            <div class="acct-detail">
              <span class="acct-name">{{ acct.name }}</span>
              <span class="acct-balance">{{ formatMoney(acct.balance) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <h3>最近记录</h3>
          <button class="section-more" @click="router.push('/records')">查看全部 →</button>
        </div>
<EmptyState v-if="recentRecords.length === 0" text="还没有记录" action-text="记第一笔" @action="router.push('/records/new')" />
        <template v-else>
          <div v-for="group in groupedRecords" :key="group.date" class="record-group">
            <div class="record-date">{{ group.date }}</div>
            <div
              v-for="record in group.items"
              :key="record.recordId"
              class="record-row"
            >
              <div class="record-left">
                <div :class="['record-type-badge', record.type]">
                  <svg v-if="record.type === 'expense'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                </div>
                <div class="record-meta">
                  <span class="record-category">{{ record.categoryName }}</span>
                  <span class="record-sub">{{ record.accountName }}{{ record.remark ? ' · ' + record.remark : '' }}</span>
                </div>
              </div>
              <span :class="['record-amount', record.type]">
                {{ record.type === 'expense' ? '-' : '+' }}{{ formatMoney(record.amount) }}
              </span>
            </div>
          </div>
        </template>
      </div>

      <div class="section-card" v-if="stats && stats.categoryStats && stats.categoryStats.length > 0">
        <div class="section-header">
          <h3>分类排行</h3>
          <button class="section-more" @click="router.push('/statistics')">详情 →</button>
        </div>
        <div class="category-rank">
          <div
            v-for="(cat, idx) in stats.categoryStats.slice(0, 5)"
            :key="cat.categoryId"
            class="rank-item"
          >
            <span class="rank-index">{{ idx + 1 }}</span>
            <span class="rank-name">{{ cat.categoryName }}</span>
            <div class="rank-bar-wrap">
              <div
                class="rank-bar"
                :style="{ width: (cat.total / Math.max(...stats.categoryStats.map(c => c.total))) * 100 + '%' }"
              />
            </div>
            <span class="rank-amount">{{ formatMoney(cat.total) }}</span>
          </div>
        </div>
      </div>
    </template>

    <button class="fab" @click="router.push('/records/new')">
      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
    </button>
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.loading-wrap {
  margin-bottom: 20px;
}

.section-card {
  background: var(--card-bg);
  border-radius: var(--card-radius);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  overflow: hidden;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.section-header h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); }

.section-more {
  background: none;
  border: none;
  font-size: 13px;
  color: var(--accent);
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s;
}
.section-more:hover { opacity: 0.7; }

.account-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  padding: 16px 20px;
}

.account-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  transition: background 0.15s;
  cursor: pointer;
}

.account-card:hover { background: var(--bg); }

.acct-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.acct-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.acct-name { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.acct-balance { font-size: 15px; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums; }

.record-group + .record-group { border-top: 1px solid var(--border-light); }
.record-date {
  padding: 8px 20px 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.record-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  transition: background 0.15s;
  cursor: pointer;
}
.record-row:hover { background: var(--bg); }

.record-left { display: flex; align-items: center; gap: 12px; }

.record-type-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.record-type-badge.expense { background: var(--expense-bg); color: var(--expense); }
.record-type-badge.income { background: var(--income-bg); color: var(--income); }

.record-meta { display: flex; flex-direction: column; gap: 2px; }
.record-category { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.record-sub { font-size: 12px; color: var(--text-secondary); }

.record-amount { font-weight: 600; font-size: 15px; font-variant-numeric: tabular-nums; }
.record-amount.expense { color: var(--expense); }
.record-amount.income { color: var(--income); }

.category-rank { padding: 8px 20px 16px; }
.rank-item { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
.rank-index {
  width: 22px;
  height: 22px;
  border-radius: 6px;
background: var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.rank-name { font-size: 14px; font-weight: 500; color: var(--text-primary); width: 72px; flex-shrink: 0; }
.rank-bar-wrap { flex: 1; height: 6px; border-radius: 3px; background: var(--border-light); overflow: hidden; }
.rank-bar { height: 100%; border-radius: 3px; background: linear-gradient(135deg, var(--accent), var(--accent-light)); min-width: 4px; }
.rank-amount { font-size: 13px; font-weight: 600; color: var(--text-primary); font-variant-numeric: tabular-nums; width: 90px; text-align: right; flex-shrink: 0; }

@media (max-width: 768px) {
  .stat-grid { grid-template-columns: 1fr; }
  .account-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
}

.fab {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent-purple));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px var(--accent-glow);
  transition: all 0.2s;
  z-index: 10;
}

.fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px var(--accent-glow);
}
</style>