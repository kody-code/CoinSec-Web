<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { updateNickname, updatePassword } from '@/api/user'
import { ElMessage } from 'element-plus'

const auth = useAuthStore()

const nicknameForm = ref({
  nickname: '',
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const nicknameLoading = ref(false)
const passwordLoading = ref(false)

async function handleNickname() {
  if (!nicknameForm.value.nickname) {
    ElMessage.warning('请输入昵称')
    return
  }
  nicknameLoading.value = true
  try {
    await updateNickname(nicknameForm.value)
    await auth.fetchUser()
    ElMessage.success('昵称已更新')
  } finally {
    nicknameLoading.value = false
  }
}

async function handlePassword() {
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    ElMessage.warning('两次密码不一致')
    return
  }
  passwordLoading.value = true
  try {
    await updatePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword,
    })
    ElMessage.success('密码已修改')
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  if (auth.user) {
    nicknameForm.value.nickname = auth.user.nickname || ''
  }
})
</script>

<template>
  <div class="profile-page">
    <div class="page-header">
      <h2>个人中心</h2>
    </div>

    <el-card class="profile-card">
      <div class="user-info">
        <el-avatar :size="64" class="user-avatar">
          {{ auth.user?.nickname?.charAt(0) || 'U' }}
        </el-avatar>
        <div class="user-detail">
          <div class="user-nickname">{{ auth.user?.nickname || '用户' }}</div>
          <div class="user-username">@{{ auth.user?.username }}</div>
        </div>
      </div>
    </el-card>

    <el-card class="section-card">
      <template #header>修改昵称</template>
      <el-form :model="nicknameForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="nicknameForm.nickname" placeholder="输入新昵称" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="nicknameLoading" @click="handleNickname">
            保存
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="section-card">
      <template #header>修改密码</template>
      <el-form :model="passwordForm" label-width="100px">
        <el-form-item label="原密码">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="passwordLoading" @click="handlePassword">
            修改
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
}

.profile-card {
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  background: #409eff;
}

.user-nickname {
  font-size: 18px;
  font-weight: 600;
}

.user-username {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}

.section-card {
  margin-bottom: 16px;
}
</style>
