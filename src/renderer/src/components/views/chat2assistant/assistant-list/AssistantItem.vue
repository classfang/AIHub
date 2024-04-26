<script setup lang="ts">
import AssistantAvatar from '@renderer/components/avatar/AssistantAvatar.vue'
import { useAssistantStore } from '@renderer/store/assistant'
import { useChatPluginStore } from '@renderer/store/chat-plugin'
import { useSystemStore } from '@renderer/store/system'
import dayjs from 'dayjs'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

const systemStore = useSystemStore()
const assistantStore = useAssistantStore()
const chatPluginStore = useChatPluginStore()

const { t } = useI18n()

const props = defineProps({
  // 是否是虚拟助手模式
  isVirtual: {
    type: Boolean,
    default: () => false
  },
  assistant: {
    type: Object as () => Assistant,
    default: () => ({})
  }
})

// 点击激活
const assistantItemActive = () => {
  if (systemStore.chatWindowLoading) {
    return
  }
  if (props.isVirtual) {
    assistantStore.currentVirtualAssistantId = props.assistant.id
  } else {
    assistantStore.currentAssistantId = props.assistant.id
  }

  // 已删除插件过滤
  const pluginIdList = chatPluginStore.chatPluginList.map((p) => p.id)
  if (props.isVirtual) {
    assistantStore.getCurrentVirtualAssistant.chatPluginIdList =
      assistantStore.getCurrentVirtualAssistant.chatPluginIdList?.filter((id) =>
        pluginIdList.includes(id)
      )
  } else {
    assistantStore.getCurrentAssistant.chatPluginIdList =
      assistantStore.getCurrentAssistant.chatPluginIdList?.filter((id) => pluginIdList.includes(id))
  }
}

// 计算显示的消息时间
const calcMessageTime = (current?: ChatMessage) => {
  if (current) {
    if (dayjs(current.createTime).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')) {
      return dayjs(current.createTime).format('HH:mm')
    } else {
      return dayjs(current.createTime).format('YYYY/MM/DD')
    }
  }
  return null
}

// 删除对话
const deleteChat = () => {
  if (props.isVirtual) {
    assistantStore.virtualAssistantList = assistantStore.virtualAssistantList.filter(
      (a) => a.id != props.assistant.id
    )
    if (assistantStore.currentVirtualAssistantId === props.assistant.id) {
      assistantStore.currentVirtualAssistantId = null
    }
  }
}

// 监听对话记录并设置标题
watch(
  () => props.assistant.chatMessageList,
  () => {
    // 如果是默认标题，则修改
    if (
      props.isVirtual &&
      props.assistant.name === t('assistantList.newChat') &&
      props.assistant.chatMessageList.length === 1
    ) {
      assistantStore.getCurrentVirtualAssistant.name = props.assistant.chatMessageList[0].content
    }
  },
  {
    deep: true
  }
)
</script>

<template>
  <div
    class="assistant-item item-click"
    :class="{
      'item-active':
        (isVirtual
          ? assistantStore.currentVirtualAssistantId
          : assistantStore.currentAssistantId) === assistant.id
    }"
    @click="assistantItemActive"
  >
    <div v-if="isVirtual" class="virtual-assistant-item-body">
      <div class="assistant-item-content">
        {{ assistant.name }}
      </div>
      <div class="assistant-item-footer">
        <div class="assistant-item-message-count">
          {{ assistant.chatMessageList.length }} {{ $t('assistantItem.messageCount') }}
        </div>
        <div
          :key="`assistant-item-time-${assistant.id}-${systemStore.dayKey}`"
          class="assistant-item-time"
        >
          {{ calcMessageTime(assistant.chatMessageList.at(-1)) }}
        </div>
      </div>
    </div>
    <template v-else>
      <AssistantAvatar :provider="assistant.provider" :size="35" class="assistant-item-avatar" />
      <div class="assistant-item-body">
        <div class="assistant-item-header">
          <div class="assistant-item-name">{{ assistant.name }}</div>
          <div
            :key="`assistant-item-time-${assistant.id}-${systemStore.dayKey}`"
            class="assistant-item-time"
          >
            {{ calcMessageTime(assistant.chatMessageList.at(-1)) }}
          </div>
        </div>
        <div class="assistant-item-content">
          {{
            assistant.chatMessageList.at(-1)
              ? assistant.chatMessageList.at(-1)?.content ||
                (assistant.chatMessageList.at(-1)?.image
                  ? $t('assistantItem.content.image')
                  : $t('assistantItem.content.empty'))
              : $t('assistantItem.content.empty')
          }}
        </div>
      </div>
    </template>

    <!-- 删除按钮 -->
    <icon-close-circle
      v-if="isVirtual"
      class="assistant-item-delete-btn"
      @click.stop="deleteChat()"
    />
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
  position: relative;

  .assistant-item-avatar {
    flex-shrink: 0;
  }

  .virtual-assistant-item-body {
    min-width: 0;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 15px;

    .assistant-item-content {
      flex-grow: 1;
      font-size: 15px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .assistant-item-footer {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .assistant-item-message-count {
        flex-shrink: 0;
        font-size: 12px;
        color: var(--color-text-3);
      }

      .assistant-item-time {
        flex-shrink: 0;
        font-size: 12px;
        color: var(--color-text-3);
      }
    }
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

  .assistant-item-delete-btn {
    font-size: 18px;
    color: var(--color-text-3);
    position: absolute;
    top: 5px;
    right: 5px;
    opacity: 0;
    transition: all 100ms linear;

    &:hover {
      color: var(--color-text-2);
    }
  }

  &:hover {
    .assistant-item-delete-btn {
      opacity: 1;
    }
  }
}
</style>
