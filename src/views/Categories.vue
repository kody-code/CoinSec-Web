<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/category'
import type { Category } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const categories = ref<Category[]>([])
const activeTab = ref('expense')
const loading = ref(false)
const dialogVisible = ref(false)
const editing = ref<Category | null>(null)

const form = ref({
  name: '',
  type: 'expense' as string,
  icon: '',
  sort: 0,
})

const filteredCategories = ref<Category[]>([])

function filterCategories() {
  filteredCategories.value = categories.value.filter((c) => c.type === activeTab.value)
}

async function fetchCategories() {
  const res = await getCategories()
  categories.value = res.data.data
  filterCategories()
}

function openCreate() {
  editing.value = null
  form.value = { name: '', type: activeTab.value, icon: '', sort: 0 }
  dialogVisible.value = true
}

function openEdit(cat: Category) {
  editing.value = cat
  form.value = { name: cat.name, type: cat.type, icon: cat.icon, sort: cat.sort }
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.value.name) {
    ElMessage.warning('请输入分类名称')
    return
  }
  loading.value = true
  try {
    if (editing.value) {
      await updateCategory(editing.value.categoryId, { name: form.value.name, icon: form.value.icon || undefined })
    } else {
      await createCategory({ name: form.value.name, type: form.value.type, icon: form.value.icon, sort: form.value.sort })
    }
    ElMessage.success(editing.value ? '修改成功' : '创建成功')
    dialogVisible.value = false
    fetchCategories()
  } finally {
    loading.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定删除该分类？')
    await deleteCategory(id)
    ElMessage.success('已删除')
    fetchCategories()
  } catch {
    // cancelled
  }
}

function handleTabChange(tab: string) {
  activeTab.value = tab
  filterCategories()
}

onMounted(fetchCategories)
</script>

<template>
  <div class="categories-page">
    <div class="page-header">
      <h2>分类管理</h2>
      <el-button type="primary" @click="openCreate">+ 新增</el-button>
    </div>

    <el-card>
      <el-tabs :model-value="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="支出" name="expense" />
        <el-tab-pane label="收入" name="income" />
      </el-tabs>

      <div class="category-list">
        <div v-for="cat in filteredCategories" :key="cat.categoryId" class="category-item">
          <div class="cat-left">
            <span class="cat-icon">{{ cat.icon }}</span>
            <span class="cat-name">{{ cat.name }}</span>
          </div>
          <div class="cat-actions">
            <el-button text type="primary" size="small" @click="openEdit(cat)">编辑</el-button>
            <el-button text type="danger" size="small" @click="handleDelete(cat.categoryId)">删除</el-button>
          </div>
        </div>
        <div v-if="filteredCategories.length === 0" class="empty-text">暂无分类</div>
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editing ? '编辑分类' : '新增分类'"
      width="400px"
    >
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="如：餐饮" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="图标名称（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.categories-page {
  max-width: 600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
}

.category-list {
  margin-top: 16px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.category-item:last-child {
  border-bottom: none;
}

.cat-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cat-icon {
  font-size: 20px;
}

.cat-name {
  font-size: 15px;
}

.cat-actions {
  display: flex;
  gap: 4px;
}

.empty-text {
  text-align: center;
  color: #999;
  padding: 40px;
}
</style>
