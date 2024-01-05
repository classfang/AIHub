<script setup lang="ts">
import { reactive, toRefs } from 'vue'
import { useSettingStore } from '@renderer/store/setting'
import { useCalendarStore } from '@renderer/store/calendar'
import { randomUUID } from '@renderer/utils/id-util'
import { nowTimestamp } from '@renderer/utils/date-util'
import { copyObj } from '@renderer/utils/object-util'
import dayjs from 'dayjs'
import { useSystemStore } from '@renderer/store/system'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { chat2bigModel, CommonChatOption } from '@renderer/utils/big-model'

// Store
const settingStore = useSettingStore()
const systemStore = useSystemStore()
const calendarStore = useCalendarStore()

// i18n
const { t } = useI18n()

// 数据绑定
const data = reactive({
  reportModalVisible: false,
  reportModalType: 'day' as CalendarReportType,
  currentDate: new Date(),
  currentReport: {} as CalendarReport
})
const { reportModalVisible, reportModalType, currentDate, currentReport } = toRefs(data)

// 打开报告Modal
const openReport = (reportModalType: CalendarReportType) => {
  let startTime = dayjs(data.currentDate).startOf(reportModalType).valueOf()
  let endTime = dayjs(data.currentDate).endOf(reportModalType).valueOf()
  // 如果用周一作为一周开始，则特殊处理
  if (reportModalType === 'week' && settingStore.aiCalendar.weekStart === 1) {
    let newDate = dayjs(data.currentDate)
    if (dayjs(data.currentDate).day() === 0) {
      newDate = newDate.subtract(1, 'day')
    }
    startTime = newDate.startOf(reportModalType).add(1, 'day').valueOf()
    endTime = newDate.endOf(reportModalType).add(1, 'day').valueOf()
  }
  let report: CalendarReport = getReport(reportModalType, startTime, endTime)
  if (!report) {
    report = {
      id: randomUUID(),
      content: '',
      createTime: nowTimestamp(),
      updateTime: nowTimestamp(),
      startTime,
      endTime
    }
  }
  data.currentReport = report
  data.reportModalType = reportModalType
  data.reportModalVisible = true
}

// 获取报告Modal标题
const getReportModalTitle = () => {
  let title = t(`aiCalendar.${data.reportModalType}Report.name`) + ' '
  switch (data.reportModalType) {
    case 'day':
      title += dayjs(data.currentReport.startTime).format('YYYY-MM-DD')
      break
    case 'week':
      title += `${dayjs(data.currentReport.startTime).format('YYYY-MM-DD')} - ${dayjs(
        data.currentReport.endTime
      ).format('YYYY-MM-DD')}`
      break
    case 'month':
      title += dayjs(data.currentReport.startTime).format('YYYY-MM')
      break
    case 'year':
      title += dayjs(data.currentReport.startTime).format('YYYY')
      break
  }
  return title
}

// 获取报告内容
const getReport = (reportType: CalendarReportType, startTime: number, endTime: number) => {
  let reportList: CalendarReport[] | undefined = undefined
  switch (reportType) {
    case 'day':
      reportList = calendarStore.dayReportList
      break
    case 'week':
      reportList = calendarStore.weekReportList
      break
    case 'month':
      reportList = calendarStore.monthReportList
      break
    case 'year':
      reportList = calendarStore.yearReportList
      break
  }
  return copyObj(reportList?.find((r) => r.startTime === startTime && r.endTime === endTime))
}

// 保存报告
const setReport = (reportType: CalendarReportType, report: CalendarReport) => {
  let reportList: CalendarReport[] | undefined = undefined
  switch (reportType) {
    case 'day':
      reportList = calendarStore.dayReportList
      break
    case 'week':
      reportList = calendarStore.weekReportList
      break
    case 'month':
      reportList = calendarStore.monthReportList
      break
    case 'year':
      reportList = calendarStore.yearReportList
      break
  }
  report.updateTime = new Date().getTime()
  const index = reportList?.findIndex(
    (r) => r.startTime === report.startTime && r.endTime === report.endTime
  )
  if (index > -1) {
    reportList[index] = report
  } else {
    reportList?.push(report)
  }
}

// 报告保存
const handleReportModalOk = () => {
  if (systemStore.calendarLoading) {
    return
  }
  setReport(data.reportModalType, data.currentReport)
  data.reportModalVisible = false
}

// 报告取消
const handleReportModalCancel = () => {
  if (systemStore.calendarLoading) {
    return
  }
  data.reportModalVisible = false
}

// 生成报告
const generateReport = async () => {
  systemStore.calendarLoading = true

  // 检查大模型配置
  if (!settingStore.openAI.baseUrl || !settingStore.openAI.key) {
    Message.error(t(`chatWindow.configMiss.OpenAI`))
    systemStore.calendarLoading = false
    return
  }

  // 获取日报列表
  const dayReportList = calendarStore.dayReportList.filter(
    (r) =>
      r.content.trim().length > 0 &&
      r.startTime >= data.currentReport.startTime &&
      r.endTime <= data.currentReport.endTime
  )
  if (dayReportList.length === 0) {
    Message.error(t(`aiCalendar.noDayReportError`))
    systemStore.calendarLoading = false
    return
  }

  // 拼接消息
  let messageContent = ''
  dayReportList.forEach(
    (r) => (messageContent += `\n\n ${dayjs(r.startTime).format('YYYY-MM-DD')}: ${r.content}`)
  )

  // 检查大模型配置
  let configErrorFlag = false
  switch (settingStore.aiCalendar.bigModel.provider) {
    case 'OpenAI':
      if (!settingStore.openAI.baseUrl || !settingStore.openAI.key) {
        configErrorFlag = true
      }
      break
    case 'Gemini':
      if (!settingStore.gemini.baseUrl || !settingStore.gemini.key) {
        configErrorFlag = true
      }
      break
    case 'Spark':
      if (!settingStore.spark.appId || !settingStore.spark.secret || !settingStore.spark.key) {
        configErrorFlag = true
      }
      break
    case 'ERNIEBot':
      if (!settingStore.ernieBot.apiKey || !settingStore.ernieBot.secretKey) {
        configErrorFlag = true
      }
      break
    case 'Tongyi':
      if (!settingStore.tongyi.apiKey) {
        configErrorFlag = true
      }
      break
  }
  if (configErrorFlag) {
    Message.error(t(`chatWindow.configMiss.${settingStore.aiCalendar.bigModel.provider}`))
    return
  }

  // 大模型通用选项
  const chat2bigModelOption: CommonChatOption = {
    model: settingStore.aiCalendar.bigModel.model,
    instruction: `Please put together a ${data.reportModalType} report based on the daily paper I gave you. Returns plain text instead of Markdown text. Return directly to the report content, no other content is required. The language returned is the language of the daily newspaper content.`,
    inputMaxTokens: -1,
    contextSize: 370,
    messages: [
      {
        id: '',
        type: 'text',
        role: 'user',
        content: messageContent,
        createTime: 0
      }
    ],
    startAnswer: () => {
      data.currentReport.content = ''
    },
    appendAnswer: (content: string) => {
      data.currentReport.content += content
    },
    end: (errMsg: any) => {
      systemStore.calendarLoading = false
      errMsg && Message.error(errMsg)
    }
  }

  // 各家大模型特有选项
  let otherOption = {}
  switch (settingStore.aiCalendar.bigModel.provider) {
    case 'OpenAI':
      otherOption = {
        apiKey: settingStore.openAI.key,
        baseURL: settingStore.openAI.baseUrl,
        type: 'chat'
      }
      break
    case 'Gemini':
      otherOption = {
        apiKey: settingStore.gemini.key,
        baseURL: settingStore.gemini.baseUrl
      }
      break
    case 'Spark':
      otherOption = {
        appId: settingStore.spark.appId,
        secretKey: settingStore.spark.secret,
        apiKey: settingStore.spark.key
      }
      break
    case 'ERNIEBot':
      otherOption = {
        apiKey: settingStore.ernieBot.apiKey,
        secretKey: settingStore.ernieBot.secretKey
      }
      break
    case 'Tongyi':
      otherOption = {
        apiKey: settingStore.tongyi.apiKey,
        type: 'chat'
      }
      break
  }

  // 大模型能力调用
  await chat2bigModel(settingStore.aiCalendar.bigModel.provider, {
    ...chat2bigModelOption,
    ...otherOption
  })
}
</script>

<template>
  <div class="ai-calendar">
    <!-- 头部 -->
    <div class="ai-calendar-header drag-area">
      <div class="ai-calendar-header-title">
        <a-space :size="10">
          <div>{{ $t('aiCalendar.name') }}</div>
          <a-tag>{{ $t(`bigModelProvider.${settingStore.aiCalendar.bigModel.provider}`) }}</a-tag>
          <a-tag>{{ settingStore.aiCalendar.bigModel.model }}</a-tag>
        </a-space>
      </div>
      <div class="ai-calendar-header-btn-group no-drag-area">
        <a-space :size="10">
          <a-button size="mini" @click="openReport('week')">{{
            $t('aiCalendar.weekReport.name')
          }}</a-button>
          <a-button size="mini" @click="openReport('month')">{{
            $t('aiCalendar.monthReport.name')
          }}</a-button>
          <a-button size="mini" @click="openReport('year')">{{
            $t('aiCalendar.yearReport.name')
          }}</a-button>
        </a-space>
      </div>
    </div>
    <!-- 主体 -->
    <div class="ai-calendar-body">
      <div class="calendar">
        <!-- 修改语言、日期跨天需要刷新组件 -->
        <a-calendar
          :key="`calendar-${settingStore.app.locale}-${systemStore.dayKey}`"
          v-model="currentDate"
        >
          <template #default="cellData">
            <div
              class="arco-calendar-date"
              @click="currentDate = new Date(cellData.year, cellData.month - 1, cellData.date)"
            >
              <div class="calendar-cell">
                <div class="calendar-cell-header">
                  <div class="arco-calendar-date-value">
                    <div class="arco-calendar-date-circle">{{ cellData.date }}</div>
                  </div>
                  <transition name="fadein">
                    <a-button
                      v-if="
                        cellData.year === currentDate.getFullYear() &&
                        cellData.month === currentDate.getMonth() + 1 &&
                        cellData.date === currentDate.getDate()
                      "
                      class="day-report-edit-btn"
                      shape="circle"
                      @click="openReport('day')"
                    >
                      <template #icon>
                        <icon-edit />
                      </template>
                    </a-button>
                  </transition>
                </div>
                <div class="calendar-cell-body">
                  {{
                    getReport(
                      'day',
                      dayjs(new Date(cellData.year, cellData.month - 1, cellData.date))
                        .startOf('day')
                        .valueOf(),
                      dayjs(new Date(cellData.year, cellData.month - 1, cellData.date))
                        .endOf('day')
                        .valueOf()
                    )?.content
                  }}
                </div>
              </div>
            </div>
          </template>
        </a-calendar>
      </div>
    </div>
    <!-- 报告Modal -->
    <a-modal
      v-model:visible="reportModalVisible"
      :mask-closable="!systemStore.calendarLoading"
      :closable="!systemStore.calendarLoading"
      unmount-on-close
      title-align="start"
      width="80vw"
    >
      <template #title>
        {{ getReportModalTitle() }}
      </template>
      <div class="report-modal">
        <a-textarea
          v-model="currentReport.content"
          class="report-modal-textarea"
          allow-clear
          :placeholder="
            $t('common.pleaseEnter') + ' ' + $t(`aiCalendar.${reportModalType}Report.content`)
          "
        />
      </div>
      <template #footer>
        <div style="display: flex; gap: 10px">
          <a-button
            v-if="reportModalType != 'day'"
            :loading="systemStore.calendarLoading"
            @click="generateReport"
            >{{ $t('aiCalendar.generate') }}
          </a-button>
          <a-button style="margin-left: auto" @click="handleReportModalCancel"
            >{{ $t('common.cancel') }}
          </a-button>
          <a-button type="primary" @click="handleReportModalOk">{{ $t('common.ok') }} </a-button>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
.ai-calendar {
  flex-grow: 1;
  display: flex;
  flex-direction: column;

  .ai-calendar-header {
    flex-shrink: 0;
    height: 40px;
    border-bottom: 1px solid var(--color-border-1);
    box-sizing: border-box;
    padding: 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .ai-calendar-header-title {
      flex-grow: 1;
      font-size: 15px;
      font-weight: 500;
    }

    .ai-calendar-header-btn-group {
      flex-shrink: 0;
    }
  }

  .ai-calendar-body {
    flex-grow: 1;
    min-height: 0;
    display: flex;

    .calendar {
      width: 100%;
      flex: 1;
      min-height: 0;

      :deep(.arco-calendar) {
        height: 100%;
        display: flex;
        flex-direction: column;
        border: none;

        .arco-calendar-header {
          flex-shrink: 0;
          padding: 15px;
        }

        .arco-calendar-body {
          flex: 1;
          min-height: 0;

          .arco-calendar-month {
            height: 100%;
            display: flex;
            flex-direction: column;

            .arco-calendar-week-list {
              flex-shrink: 0;
            }

            .arco-calendar-month-cell-body {
              flex: 1;
              min-height: 0;
              display: flex;
              flex-direction: column;

              .arco-calendar-month-row {
                flex: 1;
                min-height: calc(100% / 6);

                .arco-calendar-cell {
                  .calendar-cell {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;

                    .calendar-cell-header {
                      flex-shrink: 0;
                      display: flex;
                      align-items: center;
                      justify-content: space-between;

                      .day-report-edit-btn {
                        width: 28px;
                        height: 28px;
                      }
                    }

                    .calendar-cell-body {
                      flex: 1;
                      color: var(--color-text-2);
                      font-size: 12px;
                      overflow-y: auto;
                      word-break: break-all;
                      line-break: anywhere;
                    }
                  }
                }
              }
            }
          }

          .arco-calendar-year {
            height: 100%;
            overflow-y: auto;
          }
        }
      }
    }
  }
}

.report-modal {
  height: 60vh;
  overflow-y: auto;

  .report-modal-textarea {
    border: none;
    background-color: var(--color-fill-2);
    height: 100%;
    display: flex;

    :deep(.arco-textarea) {
      resize: none;
      flex-grow: 1;
    }
  }
}
</style>
