<script setup lang="ts">
import { openInBrowser } from '@renderer/utils/window-util'

const chatPlugin = defineModel<ChatPlugin>('chatPlugin', { default: () => ({}) })
</script>

<template>
  <a-form :model="chatPlugin" layout="vertical">
    <a-form-item field="type" :label="$t('chatPlugin.list.type')">
      <a-select v-model="chatPlugin.type" :fallback-option="false">
        <a-option value="function">Function</a-option>
      </a-select>
    </a-form-item>
    <a-form-item field="name" :label="$t('chatPlugin.list.name')">
      <a-input
        v-model="chatPlugin.name"
        :placeholder="$t('common.pleaseEnter') + ' ' + $t('chatPlugin.list.name')"
        :max-length="20"
      />
    </a-form-item>
    <a-form-item field="description" :label="$t('chatPlugin.list.description')">
      <a-textarea
        v-model="chatPlugin.description"
        :placeholder="$t('common.pleaseEnter') + ' ' + $t('chatPlugin.list.description')"
        :max-length="200"
        allow-clear
      />
    </a-form-item>
    <a-form-item>
      <a-link
        @click="openInBrowser('https://github.com/classfang/AIHub/blob/main/demo/plugin/README.md')"
        >{{ $t('chatPlugin.list.doc') }}</a-link
      >
    </a-form-item>
  </a-form>
</template>

<style scoped lang="less"></style>
