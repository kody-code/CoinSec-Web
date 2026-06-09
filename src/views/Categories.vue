<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { isNativeApp } from '@/utils/platform'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/category'
import CategoryIcon from '@/components/CategoryIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import type { Category } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const categories = ref<Category[]>([])
const isNative = isNativeApp()
const activeTab = ref('expense')
const loading = ref(false)
const showForm = ref(false)
const editing = ref<Category | null>(null)
const form = ref({ name: '', icon: '' })

const categoryIcons: Record<string, string> = {
  restaurant: '餐饮',
  shopping_cart: '购物',
  local_taxi: '出行',
  flight: '旅行',
  local_hospital: '医疗',
  school: '教育',
  sports_esports: '娱乐',
  checkroom: '服饰',
  home: '居住',
  bolt: '水电',
  payments: '金融',
  savings: '储蓄',
  credit_score: '信用',
  card_giftcard: '礼物',
  pets: '宠物',
  spa: '美容',
  exercise: '健身',
  diversity_3: '社交',
  newspaper: '订阅',
  more_horiz: '其他',
}

const filtered = ref<Category[]>([])

function filter() {
  filtered.value = categories.value.filter(c => c.type === activeTab.value)
}

async function fetch() {
  try {
    const res = await getCategories()
    categories.value = res.data.data
    filter()
  } catch {
    // 401 handled by interceptor redirect
  }
}

function openCreate() {
  editing.value = null
  form.value = { name: '', icon: '' }
  showForm.value = true
}

function openEdit(cat: Category) {
  editing.value = cat
  form.value = { name: cat.name, icon: cat.icon }
  showForm.value = true
}

async function save() {
  if (!form.value.name) { ElMessage.warning('请输入名称'); return }
  loading.value = true
  try {
    if (editing.value) {
      await updateCategory(editing.value.categoryId, { name: form.value.name, icon: form.value.icon || undefined })
    } else {
      await createCategory({ name: form.value.name, type: activeTab.value, icon: form.value.icon, sort: 0 })
    }
    showForm.value = false
    ElMessage.success(editing.value ? '已更新' : '已创建')
    fetch()
  } finally { loading.value = false }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定删除？')
    await deleteCategory(id)
    ElMessage.success('已删除')
    fetch()
  } catch {}
}

onMounted(fetch)
</script>

<template>
  <div :class="['cat-page', { 'cat-page-native': isNative }]">
    <div class="tab-bar">
      <button :class="['tab-btn', { active: activeTab === 'expense' }]" @click="activeTab = 'expense'; filter()">支出</button>
      <button :class="['tab-btn', { active: activeTab === 'income' }]" @click="activeTab = 'income'; filter()">收入</button>
      <button class="add-tab-btn" @click="openCreate">+</button>
    </div>

    <div class="cat-grid">
      <div v-for="cat in filtered" :key="cat.categoryId" class="cat-item">
        <div class="cat-icon-wrap" :class="cat.type">
          <CategoryIcon :icon="cat.icon" :size="24" />
        </div>
        <span class="cat-name">{{ cat.name }}</span>
        <div class="cat-actions">
          <button class="min-btn" @click="openEdit(cat)">✎</button>
          <button class="min-btn danger" @click="handleDelete(cat.categoryId)">✕</button>
        </div>
      </div>
      <EmptyState v-if="filtered.length === 0" text="暂无分类" icon="category" />
    </div>

    <el-dialog v-model="showForm" :title="editing ? '编辑分类' : '新增分类'" width="380px">
      <el-form label-width="60px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="如：餐饮" />
        </el-form-item>
        <el-form-item label="图标">
          <div class="icon-grid">
            <button
              v-for="(label, icon) in categoryIcons"
              :key="icon"
              type="button"
              :class="['icon-option', { active: form.icon === icon }]"
              @click.stop="form.icon = icon"
            >
              <span class="material-symbols-rounded" style="font-size:24px">{{ icon }}</span>
              <span class="icon-label">{{ label }}</span>
            </button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="save">保存</el-button>
      </template>
    </el-dialog>
    <div v-if="isNative" class="app-bottom-safe" />
  </div>
</template>

<style scoped>
.tab-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  background: var(--border-light);
  padding: 4px;
  border-radius: 12px;
}

.tab-btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 10px;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.tab-btn.active {
  background: #fff;
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.add-tab-btn {
  width: 36px;
  border: none;
  border-radius: 10px;
  background: transparent;
  font-size: 18px;
  color: var(--accent);
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  transition: all 0.2s;
}

.add-tab-btn:hover {
  background: var(--accent-bg);
}

.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.cat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 10px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  position: relative;
  transition: all 0.2s;
}

.cat-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.cat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cat-icon-wrap.expense {
  background: var(--expense-bg);
  color: var(--expense);
}

.cat-icon-wrap.income {
  background: var(--income-bg);
  color: var(--income);
}

.cat-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.cat-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  display: none;
  gap: 2px;
}

.cat-item:hover .cat-actions {
  display: flex;
}

.min-btn {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: none;
  font-size: 11px;
  cursor: pointer;
  background: var(--border-light);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.min-btn:hover { background: var(--border); }
.min-btn.danger { color: var(--expense); }
.min-btn.danger:hover { background: var(--expense-bg); }

@media (max-width: 768px) {
  .cat-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
  .cat-actions { display: flex !important; }
}

.cat-page-native {
  padding: 0 16px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
  padding: 4px 0;
}
.icon-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px 6px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: var(--bg);
  cursor: pointer;
  transition: all 0.15s;
  color: var(--text-secondary);
  font-family: inherit;
}
.icon-option:hover {
  border-color: var(--primary-light);
  background: var(--primary-bg);
}
.icon-option.active {
  border-color: var(--primary);
  background: var(--primary-bg);
  color: var(--primary);
}
.icon-label {
  font-size: 11px;
  color: inherit;
  white-space: nowrap;
}

</style>
