<script setup lang="ts">
import FileAvatar from '@renderer/components/avatar/FileAvatar.vue'
import { formatFileSize } from '@renderer/utils/file-util'
import { showItemInFolder } from '@renderer/utils/ipc-util'

defineProps({
  messageFile: {
    type: Object as () => MessageFile,
    default: () => ({})
  }
})
</script>

<template>
  <div class="chat-message-file" @click="showItemInFolder(messageFile.path)">
    <FileAvatar
      class="chat-message-file-avatar"
      :type="messageFile.name.split('.').at(-1)"
      :size="30"
    />
    <div class="chat-message-file-body">
      <div class="chat-message-file-name">{{ messageFile.name }}</div>
      <div class="chat-message-file-size">
        {{ messageFile.name.split('.').at(-1) }} {{ formatFileSize(messageFile.size) }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.chat-message-file {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 170px;
  max-width: 170px;
  padding: 5px;
  background-color: var(--color-fill-2);
  border-radius: var(--border-radius-small);
  cursor: pointer;

  .chat-message-file-avatar {
    flex-shrink: 0;
  }

  .chat-message-file-body {
    height: 35px;
    min-width: 0;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .chat-message-file-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-1);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chat-message-file-size {
      font-size: 11px;
      color: var(--color-text-2);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>
