<script setup lang="ts">
import AssistantAvatar from '@renderer/components/avatar/AssistantAvatar.vue'
import { useAssistantStore } from '@renderer/store/assistant'
import { useChatPluginStore } from '@renderer/store/chat-plugin'
import { useSystemStore } from '@renderer/store/system'
import dayjs from 'dayjs'

const systemStore = useSystemStore()
const assistantStore = useAssistantStore()
const chatPluginStore = useChatPluginStore()

const props = defineProps({
  assistant: {
    type: Object as () => Assistant,
    default: () => ({})
  }
})

const assistantItemActive = () => {
  if (systemStore.chatWindowLoading) {
    return
  }
  assistantStore.currentAssistantId = props.assistant.id

  // 已删除插件过滤
  const pluginIdList = chatPluginStore.chatPluginList.map((p) => p.id)
  assistantStore.getCurrentAssistant.chatPluginIdList =
    assistantStore.getCurrentAssistant.chatPluginIdList?.filter((id) => pluginIdList.includes(id))
}

// 计算显示的消息时间
const calcMessageTime = (current: ChatMessage) => {
  if (current) {
    if (dayjs(current.createTime).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')) {
      return dayjs(current.createTime).format('HH:mm')
    } else {
      return dayjs(current.createTime).format('YYYY/MM/DD')
    }
  }
  return null
}
</script>

<template>
  <div
    class="assistant-item"
    :class="{ 'assistant-item-active': assistantStore.currentAssistantId === assistant.id }"
    @click="assistantItemActive"
  >
    <AssistantAvatar :provider="assistant.provider" :size="35" class="assistant-item-avatar" />
    <div class="assistant-item-body">
      <div class="assistant-item-header">
        <div class="assistant-item-name">{{ assistant.name }}</div>
        <div
          :key="`assistant-item-time-${assistant.id}-${systemStore.dayKey}`"
          class="assistant-item-time"
        >
          {{ calcMessageTime(assistant.chatMessageList[assistant.chatMessageList.length - 1]) }}
        </div>
      </div>
      <div class="assistant-item-content">
        {{
          assistant.chatMessageList[assistant.chatMessageList.length - 1]
            ? assistant.chatMessageList[assistant.chatMessageList.length - 1].content ||
              (assistant.chatMessageList[assistant.chatMessageList.length - 1].image
                ? $t('assistantItem.content.image')
                : $t('assistantItem.content.empty'))
            : $t('assistantItem.content.empty')
        }}
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.assistant-item {
  width: 100%;
  box-sizing: border-box;
  padding: 15px;
  background-color: var(--color-fill-1);
  border-radius: var(--border-radius-small);
  display: flex;
  align-items: center;
  gap: 10px;

  .assistant-item-avatar {
    flex-shrink: 0;
  }

  .assistant-item-body {
    height: 35px;
    flex-grow: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .assistant-item-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 5px;

      .assistant-item-name {
        flex-grow: 1;
        font-size: 15px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .assistant-item-time {
        flex-shrink: 0;
        font-size: 11px;
        color: var(--color-text-3);
      }
    }

    .assistant-item-content {
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--color-text-3);
    }
  }
}

.assistant-item-active {
  background-color: var(--color-fill-3);
}
</style>
