<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/category'
import CategoryIcon from '@/components/CategoryIcon.vue'
import type { Category } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const categories = ref<Category[]>([])
const activeTab = ref('expense')
const loading = ref(false)
const showForm = ref(false)
const editing = ref<Category | null>(null)
const form = ref({ name: '', icon: '' })

const filtered = ref<Category[]>([])

function filter() {
  filtered.value = categories.value.filter(c => c.type === activeTab.value)
}

async function fetch() {
  const res = await getCategories()
  categories.value = res.data.data
  filter()
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
</script>

<template>
  <div class="cat-page">
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
      <div v-if="filtered.length === 0" class="empty">暂无分类</div>
    </div>

    <el-dialog v-model="showForm" :title="editing ? '编辑分类' : '新增分类'" width="380px">
      <el-form label-width="60px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="如：餐饮" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="图标名称（如 restaurant）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.cat-page {
  max-width: 480px;
  margin: 0 auto;
}

.tab-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  background: #f1f5f9;
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
  color: #64748b;
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
  background: #eef2ff;
}

.cat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
  background: #fef2f2;
  color: #ef4444;
}

.cat-icon-wrap.income {
  background: #ecfdf5;
  color: #10b981;
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
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.min-btn:hover { background: #e2e8f0; }
.min-btn.danger { color: #ef4444; }
.min-btn.danger:hover { background: #fef2f2; }

.empty {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--text-secondary);
  padding: 40px;
}


</style>
