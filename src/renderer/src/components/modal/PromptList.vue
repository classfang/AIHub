<script setup lang="ts">
import prompts from '@renderer/assets/json/prompts.json'
import { useSettingStore } from '@renderer/store/setting'
import { reactive, toRefs } from 'vue'

const settingStore = useSettingStore()

// 数据绑定
const data = reactive({
  keyword: ''
})
const { keyword } = toRefs(data)

const modalVisible = defineModel<boolean>('modalVisible', { default: () => false })

const emits = defineEmits(['selectPrompt'])

const selectPrompt = (prompt: string) => {
  emits('selectPrompt', prompt)
  modalVisible.value = false
}
</script>

<template>
  <a-modal
    v-model:visible="modalVisible"
    :footer="false"
    unmount-on-close
    title-align="start"
    width="80vw"
  >
    <template #title>
      <div class="prompt-list-header">
        <a-input-search
          v-model="keyword"
          size="small"
          :placeholder="$t('chatWindow.fastPromptSearch')"
          class="prompt-list-search-input"
        />
      </div>
    </template>
    <div class="prompt-list-page">
      <template
        v-for="p in settingStore.app.locale === 'zh_CN' ? prompts.cn : prompts.en"
        :key="p[0]"
      >
        <div
          v-if="p[0].includes(keyword) || p[1].includes(keyword)"
          class="prompt-item"
          @click="selectPrompt(p[1])"
        >
          <div class="prompt-item-name">{{ p[0] }}</div>
          <div class="prompt-item-prompt">{{ p[1] }}</div>
        </div>
      </template>
    </div>
  </a-modal>
</template>

<style lang="less" scoped>
.prompt-list-header {
  .prompt-list-search-input {
    border: none;
    background-color: var(--color-fill-2);
  }
}

.prompt-list-page {
  height: 60vh;
  overflow-y: auto;

  .prompt-item {
    padding: 10px;
    transition: all 100ms linear;
    border-radius: var(--border-radius-small);

    &:hover {
      background-color: var(--color-fill-2);
    }

    &:active {
      background-color: var(--color-fill-1);
    }

    .prompt-item-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-1);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .prompt-item-prompt {
      font-size: 14px;
      color: var(--color-text-2);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>
