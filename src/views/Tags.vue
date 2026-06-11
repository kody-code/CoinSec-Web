<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { isNativeApp } from '@/utils/platform'
import { getTags, createTag, updateTag, deleteTag } from '@/api/tag'
import EmptyState from '@/components/EmptyState.vue'
import type { Tag } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const tags = ref<Tag[]>([])
const isNative = isNativeApp()
const loading = ref(false)
const showForm = ref(false)
const editing = ref<Tag | null>(null)
const form = ref({ name: '', color: '#6366f1' })

const presetColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#64748b', '#78716c',
]

async function fetchTags() {
  loading.value = true
  try {
    const res = await getTags()
    tags.value = res.data.data
  } catch (e) {
    console.error('[Tags] Failed to load data:', e)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { name: '', color: '#6366f1' }
  showForm.value = true
}

function openEdit(tag: Tag) {
  editing.value = tag
  form.value = { name: tag.name, color: tag.color || '#6366f1' }
  showForm.value = true
}

async function handleSave() {
  if (!form.value.name) { ElMessage.warning('请输入标签名称'); return }
  loading.value = true
  try {
    if (editing.value) {
      await updateTag(editing.value.tagId, { name: form.value.name, color: form.value.color })
    } else {
      await createTag({ name: form.value.name, color: form.value.color })
    }
    showForm.value = false
    ElMessage.success(editing.value ? '已更新' : '已创建')
    fetchTags()
  } finally { loading.value = false }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定删除该标签？', '删除确认', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    await deleteTag(id)
    ElMessage.success('已删除')
    fetchTags()
  } catch {}
}

onMounted(fetchTags)
</script>

<template>
  <div :class="['tag-page', { 'tag-page-native': isNative }]">
    <div class="page-head">
      <p class="page-subtitle">管理你的标签，为记账记录添加更多维度</p>
    </div>

    <div class="page-actions">
      <button class="btn-primary" @click="openCreate">+ 新建标签</button>
    </div>

    <EmptyState v-if="tags.length === 0 && !loading" text="还没有标签" icon="label" />

    <div v-else class="tag-grid">
      <div v-for="tag in tags" :key="tag.tagId" class="tag-card">
        <div class="tag-dot" :style="{ background: tag.color || '#6366f1' }" />
        <span class="tag-name">{{ tag.name }}</span>
        <span class="tag-color-hex" :style="{ color: tag.color || '#6366f1' }">{{ tag.color }}</span>
        <div class="tag-actions">
          <button class="action-btn" @click="openEdit(tag)">编辑</button>
          <button class="action-btn danger" @click="handleDelete(tag.tagId)">删除</button>
        </div>
      </div>
    </div>

    <el-dialog v-model="showForm" :title="editing ? '编辑标签' : '新建标签'" width="380px">
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="如：工作餐" />
        </el-form-item>
        <el-form-item label="颜色">
          <div class="color-picker-grid">
            <button
              v-for="c in presetColors" :key="c"
              :class="['color-dot', { active: form.color === c }]"
              :style="{ background: c }"
              @click="form.color = c"
            />
          </div>
          <div class="color-custom">
            <el-input v-model="form.color" placeholder="#FF6B6B" style="width: 140px; margin-top: 8px" />
            <span class="color-preview" :style="{ background: form.color }" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <div v-if="isNative" class="app-bottom-safe" />
  </div>
</template>

<style scoped>
.tag-page { max-width: 720px; margin: 0 auto; }
.tag-page-native { max-width: 100%; padding: 0 16px; }
.page-head { margin-bottom: 20px; }
.page-subtitle { font-size: 14px; color: var(--text-secondary); margin: 0; }
.page-actions { margin-bottom: 20px; }

.btn-primary {
  padding: 8px 18px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent-purple));
  color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: inherit; transition: all 0.2s; white-space: nowrap;
}
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px var(--accent-glow); }

.tag-grid { display: flex; flex-direction: column; gap: 8px; }
.tag-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 18px; background: #fff; border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.2s;
}
.tag-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.tag-dot { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; }
.tag-name { font-size: 15px; font-weight: 500; color: var(--text-primary); }
.tag-color-hex { font-size: 12px; font-variant-numeric: tabular-nums; color: var(--text-secondary); margin-left: auto; }
.tag-actions { display: flex; gap: 4px; margin-left: 8px; }
.action-btn {
  padding: 4px 10px; border-radius: 6px; border: none; font-size: 12px;
  font-weight: 500; cursor: pointer; font-family: inherit;
  background: var(--border-light); color: var(--text-secondary); transition: all 0.2s;
}
.action-btn:hover { background: var(--border); }
.action-btn.danger { color: var(--expense); }
.action-btn.danger:hover { background: var(--expense-bg); }

.color-picker-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.color-dot {
  width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent;
  cursor: pointer; transition: all 0.15s;
}
.color-dot:hover { transform: scale(1.15); }
.color-dot.active { border-color: var(--text-primary); box-shadow: 0 0 0 2px rgba(0,0,0,0.1); }
.color-custom { display: flex; align-items: center; gap: 8px; }
.color-preview { width: 20px; height: 20px; border-radius: 4px; flex-shrink: 0; }

@media (max-width: 768px) {
  .tag-card { padding: 12px 14px; }
  .tag-color-hex { display: none; }
}

.app-bottom-safe { height: 72px; }
</style>