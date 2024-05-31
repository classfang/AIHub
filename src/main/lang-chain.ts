// langChain-redis 新增文件
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { PPTXLoader } from '@langchain/community/document_loaders/fs/pptx'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { OpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { RedisVectorStore } from '@langchain/redis'
import { RedisClientOptions } from '@redis/client/dist/lib/client'
import { ipcMain } from 'electron'
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents'
import { createRetrievalChain } from 'langchain/chains/retrieval'
import { BaseDocumentLoader } from 'langchain/dist/document_loaders/base'
import { TextLoader } from 'langchain/document_loaders/fs/text'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { createClient } from 'redis'

export const initLangChain = () => {
  ipcMain.handle(
    'lang-chain-redis-add-file',
    async (
      _event,
      redisClientOptions: RedisClientOptions,
      openaiConfig: {
        baseUrl: string
        key: string
      },
      indexName: string,
      text: string
    ) => {
      // redis 连接
      const client = createClient(redisClientOptions)
      await client.connect()

      // redis 向量库
      const vectorStore = new RedisVectorStore(
        new OpenAIEmbeddings({
          openAIApiKey: openaiConfig.key,
          configuration: {
            baseURL: openaiConfig.baseUrl
          }
        }),
        {
          redisClient: client as any,
          indexName: indexName
        }
      )

      // 文本分段
      const textSplitter = new RecursiveCharacterTextSplitter({
        // 最长1000字符
        chunkSize: 1000,
        // 重复50字符，便于连接上下文
        chunkOverlap: 50
      })
      const splitStrs = await textSplitter.splitText(text)

      // 缓存全文本
      const now = new Date().getTime()
      const fileKey = 'files:' + indexName + ':' + now
      await client.hSet(fileKey, {
        text: text,
        createTime: now,
        updateTime: now
      })

      // 保存文段文本向量数据
      await vectorStore.addDocuments(
        splitStrs.map((str) => {
          return { pageContent: str, metadata: { fileKey: fileKey } }
        })
      )

      // redis 断连
      await client.disconnect()

      // 返回全文本的缓存key
      return fileKey
    }
  )

  // langChain-redis 文件列表
  ipcMain.handle(
    'lang-chain-redis-list-file',
    async (_event, redisClientOptions: RedisClientOptions, indexName: string) => {
      // redis 连接
      const client = createClient(redisClientOptions)
      await client.connect()

      // 获取全文本列表
      const fileKeys = await client.keys('files:' + indexName + ':*')
      const files: { key: string; text: string; createTime: number; updateTime: number }[] = []
      for (const fileKey of fileKeys) {
        const file = await client.hGetAll(fileKey)
        files.push({
          key: fileKey,
          text: file.text ?? '',
          createTime: file.createTime ? Number(file.createTime) : 0,
          updateTime: file.updateTime ? Number(file.updateTime) : 0
        })
      }

      // 排序
      files.sort((f1, f2) => f2.updateTime - f1.updateTime)

      // 获取向量数据数量
      const vectorKeys = await client.keys('doc:' + indexName + ':*')

      // redis 断连
      await client.disconnect()

      // 返回全文本列表
      return {
        files,
        docCount: vectorKeys.length
      }
    }
  )

  // langChain-redis 文件删除
  ipcMain.handle(
    'lang-chain-redis-delete-file',
    async (_event, redisClientOptions: RedisClientOptions, indexName: string, fileKey: string) => {
      // redis 连接
      const client = createClient(redisClientOptions)
      await client.connect()

      // 首先删除文本对应的向量数据
      const vectorKeys = await client.keys('doc:' + indexName + ':*')
      if (vectorKeys.length > 0) {
        for (const vectorKey of vectorKeys) {
          const metadata = await client.hGet(vectorKey, 'metadata')
          if (metadata && JSON.parse(metadata).fileKey === fileKey) {
            await client.del(vectorKey)
          }
        }
      }

      // 删除文本数据
      await client.del(fileKey)

      // redis 断连
      await client.disconnect()
    }
  )

  // langChain-redis 提问
  ipcMain.handle(
    'lang-chain-redis-question',
    async (
      _event,
      redisClientOptions: RedisClientOptions,
      openaiConfig: {
        baseUrl: string
        key: string
      },
      indexName: string,
      question: string
    ) => {
      // redis 连接
      const client = createClient(redisClientOptions)
      await client.connect()

      // redis 向量库
      const vectorStore = new RedisVectorStore(
        new OpenAIEmbeddings({
          openAIApiKey: openaiConfig.key,
          configuration: {
            baseURL: openaiConfig.baseUrl
          }
        }),
        {
          redisClient: client as any,
          indexName: indexName
        }
      )

      // 对话模型
      const model = new OpenAI({
        modelName: 'gpt-3.5-turbo',
        openAIApiKey: openaiConfig.key,
        configuration: {
          baseURL: openaiConfig.baseUrl
        }
      })
      const combineDocsChain = await createStuffDocumentsChain({
        llm: model,
        prompt: ChatPromptTemplate.fromTemplate(`{context}\n\n{input}`)
      })
      const retriever = vectorStore.asRetriever()
      const chain = await createRetrievalChain({
        combineDocsChain,
        retriever
      })

      // 提问
      const response = await chain.invoke({
        input: question
      })

      // redis 断连
      await client.disconnect()

      // 返回结果
      return response
    }
  )

  // langChain 加载文件
  ipcMain.handle('lang-chain-load-file', async (_event, filePath: string) => {
    let loader: BaseDocumentLoader | null = null

    if (filePath.endsWith('.txt')) {
      loader = new TextLoader(filePath)
    } else if (filePath.endsWith('.pdf')) {
      loader = new PDFLoader(filePath)
    } else if (filePath.endsWith('.docx')) {
      loader = new DocxLoader(filePath)
    } else if (filePath.endsWith('.pptx')) {
      loader = new PPTXLoader(filePath)
    }

    if (!loader) {
      return ''
    }

    const docs = await loader.load()
    if (!docs || docs.length === 0) {
      return ''
    }

    return docs.reduce((accumulator, currentObject) => {
      return accumulator + currentObject.pageContent
    }, '')
  })
}
