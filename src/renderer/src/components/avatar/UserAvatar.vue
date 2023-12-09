<script setup lang="ts">
import { useUserStore } from '@renderer/store/user'
import { useSystemStore } from '@renderer/store/system'
import { reactive, toRefs } from 'vue'
import { FileItem, RequestOption } from '@arco-design/web-vue'
import { randomUUID } from '@renderer/utils/id-util'
import { saveFileByPath } from '@renderer/utils/ipc-util'

const userStore = useUserStore()
const systemStore = useSystemStore()

defineProps({
  editable: {
    type: Boolean,
    default: false
  },
  size: {
    type: Number,
    default: 30
  }
})

const data = reactive({
  modalVisible: false,
  avatarFile: { url: userStore.avatar } as FileItem
})
const { modalVisible, avatarFile } = toRefs(data)

const selectImageRequest = (option: RequestOption) => {
  const { fileItem, onSuccess } = option
  const imagePath = fileItem.file?.path
  if (imagePath) {
    fileItem.url = fileItem.file?.path
    data.avatarFile = fileItem
    saveFileByPath(
      imagePath,
      `${randomUUID()}${imagePath.substring(imagePath.lastIndexOf('.'))}`
    ).then((res) => {
      userStore.avatar = res
      onSuccess()
    })
  }

  return {
    abort: () => {}
  }
}
</script>

<template>
  <div>
    <a-avatar
      shape="square"
      :size="size"
      @click="modalVisible = !systemStore.chatWindowLoading && editable"
    >
      <img v-if="userStore.avatar" :src="'file://' + userStore.avatar" />
      <icon-user v-else />
    </a-avatar>
    <!-- 用户设置Modal -->
    <a-modal
      v-model:visible="modalVisible"
      :footer="false"
      unmount-on-close
      title-align="start"
      width="350px"
    >
      <template #title> {{ $t('userSetting.name') }} </template>
      <div
        style="
          height: 200px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        "
      >
        <a-upload
          :file-list="avatarFile ? [avatarFile] : []"
          :show-file-list="false"
          :custom-request="selectImageRequest"
          accept="image/*"
        >
          <template #upload-button>
            <div class="arco-upload-list-item">
              <div
                v-if="avatarFile && avatarFile.url"
                class="arco-upload-list-picture custom-upload-avatar"
              >
                <img :src="'file://' + avatarFile.url" />
                <div class="arco-upload-list-picture-mask">
                  <IconEdit />
                </div>
              </div>
              <div v-else class="arco-upload-picture-card">
                <div class="arco-upload-picture-card-text">
                  <IconPlus />
                  <div style="margin-top: 10px; font-weight: 600">
                    {{ $t('userSetting.selectAvatar') }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </a-upload>
        <a-space direction="horizontal" :size="10" fill>
          <div>{{ $t('userSetting.nickname') }}</div>
          <a-input v-model="userStore.nickname" size="small" />
        </a-space>
      </div>
    </a-modal>
  </div>
</template>

<style lang="less" scoped></style>
