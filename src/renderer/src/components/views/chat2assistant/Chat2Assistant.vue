<script setup lang="ts">
import AssistantList from '@renderer/components/views/chat2assistant/assistant-list/AssistantList.vue'
import ChatWindow from '@renderer/components/views/chat2assistant/chat-window/ChatWindow.vue'
import EmptyChatWindow from '@renderer/components/views/chat2assistant/chat-window/EmptyChatWindow.vue'
import { useAssistantStore } from '@renderer/store/assistant'
import { onMounted, reactive, ref, toRefs } from 'vue'

// store
const assistantStore = useAssistantStore()

// ref
const chatAssistantRightRef = ref()

// 数据绑定
const data = reactive({
  // 是否收起左边栏
  isLeftClose: false,
  // 是否显示左边栏伸缩按钮
  isLeftCloseBtnShow: false
})
const { isLeftClose, isLeftCloseBtnShow } = toRefs(data)

// 挂载完毕
onMounted(() => {
  // 添加鼠标移动事件处理程序
  chatAssistantRightRef.value.addEventListener('mousemove', function (event) {
    // 获取鼠标相对于元素左边框的水平位置
    const x = event.clientX - chatAssistantRightRef.value.getBoundingClientRect().left

    // 判断鼠标是否接近左边框
    data.isLeftCloseBtnShow = x < 20
  })
})
</script>

<template>
  <div class="chat-assistant">
    <div v-if="!isLeftClose" class="chat-assistant-left">
      <!-- 助手列表 -->
      <AssistantList class="assistant-list" />
    </div>
    <div ref="chatAssistantRightRef" class="chat-assistant-right">
      <!-- 隐藏/显示左边栏按钮 -->
      <transition name="fadein">
        <a-button
          v-if="isLeftCloseBtnShow"
          shape="circle"
          class="chat-assistant-left-close-btn"
          size="mini"
          @click="isLeftClose = !isLeftClose"
        >
          <icon-right v-if="isLeftClose" />
          <icon-left v-else />
        </a-button>
      </transition>
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

  .chat-assistant-left {
    flex-shrink: 0;
    width: 270px;
    height: 100%;
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
      position: absolute;
      left: 5px;
      top: 50%;
      z-index: 1;
    }

    .chat-window {
      flex-grow: 1;
    }
  }
}
</style>
