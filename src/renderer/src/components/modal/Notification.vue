<script setup lang="ts">
import { useNotificationStore } from '@renderer/store/notification'
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
      <a-badge :count="isRead ? 0 : 1" dot :dot-style="{ width: '6px', height: '6px' }">
        <slot name="default"></slot>
      </a-badge>
    </div>

    <!-- 提醒Modal -->
    <a-modal
      v-model:visible="modalVisible"
      :footer="false"
      unmount-on-close
      title-align="start"
      width="80vw"
    >
      <template #title>
        <div class="notification-title">
          <span>{{ $t('notification.name') }}</span>
          <icon-delete class="notification-clear-btn" />
        </div>
      </template>
      <!-- 提醒页 -->
      <div class="notification-page">
        <a-space
          v-if="notificationStore.notifications.length > 0"
          class="notification-list"
          direction="vertical"
          :size="10"
        >
          <div v-for="n in notificationStore.notifications" :key="n.createTime">
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
    </a-modal>
  </div>
</template>

<style lang="less" scoped>
.notification-title {
  display: flex;
  align-items: center;
  gap: 10px;

  .notification-clear-btn {
    font-size: 16px;
    stroke-width: 4;
    cursor: pointer;
    color: rgb(var(--danger-5));

    &:active {
      stroke-width: 5;
    }
  }
}

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
