<script setup lang="ts">
import { useNotificationStore } from '@renderer/store/notification'
import { clipboardWriteText } from '@renderer/utils/ipc-util'
import { openInBrowser } from '@renderer/utils/window-util'
import dayjs from 'dayjs'
import { reactive, toRefs, watch } from 'vue'

const notificationStore = useNotificationStore()

const data = reactive({
  modalVisible: false,
  isRead: true
})
const { modalVisible, isRead } = toRefs(data)

const openModal = () => {
  data.modalVisible = true
  data.isRead = true
}

watch(
  () => notificationStore.notifications,
  (value) => {
    data.isRead = value.length == 0
  },
  {
    deep: true
  }
)
</script>

<template>
  <div class="notification">
    <div @click="openModal()">
      <a-badge :count="isRead ? 0 : 1" dot :dot-style="{ width: '7px', height: '7px' }">
        <slot name="default"></slot>
      </a-badge>
    </div>

    <!-- 提醒Modal -->
    <a-modal v-model:visible="modalVisible" unmount-on-close title-align="start" width="80vw">
      <template #title>{{ $t('notification.name') }}</template>
      <!-- 提醒页 -->
      <div class="notification-page">
        <a-space
          v-if="notificationStore.notifications.length > 0"
          class="notification-list"
          direction="vertical"
          :size="10"
        >
          <div
            v-for="n in notificationStore.notifications"
            :key="n.createTime"
            @click="clipboardWriteText(n.content)"
          >
            <a-tag
              class="notification-item select-text"
              :color="n.type === 'error' ? 'red' : n.type === 'warn' ? 'orangered' : 'blue'"
            >
              <div class="notification-title">
                <div>{{ $t(`notification.type.${n.type}`) }}</div>
                <div>{{ dayjs(n.createTime).format('YYYY-MM-DD HH:mm:ss') }}</div>
              </div>
              <div class="notification-content">{{ n.content }}</div>
            </a-tag>
          </div>
        </a-space>
        <div v-else class="notification-page-empty">
          <a-empty>
            <template #image>
              <icon-notification />
            </template>
            {{ $t('notification.empty') }}
          </a-empty>
        </div>
      </div>
      <template #footer>
        <div style="display: flex; gap: 10px">
          <a-button size="small" @click="notificationStore.notifications = []">
            <a-space :size="5">
              <icon-delete />
              <span>{{ $t('notification.clear') }}</span>
            </a-space>
          </a-button>
          <a-button
            style="margin-left: auto"
            size="small"
            @click="openInBrowser('https://github.com/classfang/AIHub/issues/new')"
          >
            <a-space :size="5">
              <icon-bug />
              <span>{{ $t('notification.issues') }}</span>
            </a-space>
          </a-button>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<style lang="less" scoped>
.notification-page {
  height: 60vh;
  overflow-y: auto;

  .notification-list {
    width: 100%;

    .notification-item {
      height: auto;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      cursor: pointer;
      padding: 10px;
      gap: 10px;
      font-size: var(--font-size-sm);

      .notification-title {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .notification-content {
        width: 100%;
        white-space: pre-wrap;
        line-break: anywhere;
      }
    }
  }

  .notification-page-empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
