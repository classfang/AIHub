<script setup lang="ts">
const chatPlugin = defineModel<ChatPlugin>('chatPlugin', { default: () => ({}) })
</script>

<template>
  <a-form :model="chatPlugin" layout="vertical">
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
  </a-form>
</template>

<style scoped lang="less"></style>
