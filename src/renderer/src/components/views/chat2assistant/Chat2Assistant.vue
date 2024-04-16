<script setup lang="ts">
import AssistantList from '@renderer/components/views/chat2assistant/assistant-list/AssistantList.vue'
import ChatWindow from '@renderer/components/views/chat2assistant/chat-window/ChatWindow.vue'
import EmptyChatWindow from '@renderer/components/views/chat2assistant/chat-window/EmptyChatWindow.vue'
import { useAssistantStore } from '@renderer/store/assistant'
import { reactive, ref, toRefs } from 'vue'

// store
const assistantStore = useAssistantStore()

// ref
const chatAssistantRightRef = ref()

// 数据绑定
const data = reactive({
  // 是否收起左边栏
  isLeftClose: false
})
const { isLeftClose } = toRefs(data)
</script>

<template>
  <div class="chat-assistant">
    <transition name="chat-assistant-left-transition">
      <div v-if="!isLeftClose" class="chat-assistant-left">
        <!-- 助手列表 -->
        <AssistantList class="assistant-list" />
      </div>
    </transition>
    <div ref="chatAssistantRightRef" class="chat-assistant-right">
      <!-- 隐藏/显示左边栏按钮 -->
      <a-tooltip
        :content="$t('chatWindow.closeLeft')"
        position="right"
        mini
        :content-style="{ fontSize: '12px' }"
      >
        <div class="chat-assistant-left-close-btn" @click="isLeftClose = !isLeftClose">
          <div
            class="left-close-btn-icon"
            :class="{ 'left-close-btn-icon-right': isLeftClose }"
          ></div>
          <div
            class="left-close-btn-icon"
            :class="{ 'left-close-btn-icon-right': isLeftClose }"
          ></div>
        </div>
      </a-tooltip>

      <!-- 助手聊天窗口 -->
      <ChatWindow
        v-if="assistantStore.currentAssistantId"
        :key="'chat-window-' + assistantStore.currentAssistantId"
        class="chat-window"
      />
      <!-- 助手空状态 -->
      <EmptyChatWindow v-else />
    </div>
  </div>
</template>

<style lang="less" scoped>
.chat-assistant {
  width: 100%;
  flex-grow: 1;
  display: flex;
  overflow: hidden;

  .chat-assistant-left-transition-enter-active,
  .chat-assistant-left-transition-leave-active {
    transition: width 300ms;
  }
  .chat-assistant-left-transition-enter-from,
  .chat-assistant-left-transition-leave-to {
    width: 0;
  }
  .chat-assistant-left-transition-enter-to,
  .chat-assistant-left-transition-leave-from {
    width: 270px;
  }

  .chat-assistant-left {
    flex-shrink: 0;
    max-width: 270px;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--color-border-1);
    box-sizing: border-box;

    .assistant-list {
      flex-grow: 1;
    }
  }

  .chat-assistant-right {
    flex-grow: 1;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;

    .chat-assistant-left-close-btn {
      height: 40px;
      padding: 0 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: absolute;
      left: 0;
      top: 50%;
      z-index: 1;
      transform: translateY(-50%);
      cursor: pointer;

      .left-close-btn-icon {
        height: 12px;
        width: 4px;
        background-color: var(--color-border-2);
        transition: all 100ms linear;
      }

      .left-close-btn-icon:first-child {
        border-radius: 2px 2px 0 0;
        transform: translateY(2px);
      }

      .left-close-btn-icon:last-child {
        border-radius: 0 0 2px 2px;
        transform: translateY(-2px);
      }

      &:hover {
        .left-close-btn-icon {
          background-color: var(--color-border-4);
        }

        .left-close-btn-icon:first-child {
          transform: translateY(2px) rotate(15deg);
        }

        .left-close-btn-icon:last-child {
          transform: translateY(-2px) rotate(-15deg);
        }

        .left-close-btn-icon-right:first-child {
          transform: translateY(2px) rotate(-15deg);
        }

        .left-close-btn-icon-right:last-child {
          transform: translateY(-2px) rotate(15deg);
        }
      }
    }

    .chat-window {
      flex-grow: 1;
    }
  }
}
</style>
