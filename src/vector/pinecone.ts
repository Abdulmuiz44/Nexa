import { logger } from "../agent/utils/logger"

export interface VectorDocument {
  id: string
  content: string
  metadata: Record<string, any>
  embedding?: number[]
}

export interface SearchResult {
  id: string
  score: number
  content: string
  metadata: Record<string, any>
}

export class PineconeVectorStore {
  private apiKey: string
  private environment: string
  private indexName: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.PINECONE_API_KEY || ""
    this.environment = process.env.PINECONE_ENVIRONMENT || ""
    this.indexName = process.env.PINECONE_INDEX_NAME || "nexa-content"
    this.baseUrl = `https://${this.indexName}-${this.environment}.svc.pinecone.io`

    if (!this.apiKey || !this.environment) {
      throw new Error("Pinecone configuration missing")
    }
  }

  async upsertDocuments(documents: VectorDocument[]): Promise<boolean> {
    try {
      // Generate embeddings for documents without them
      const documentsWithEmbeddings = await Promise.all(
        documents.map(async (doc) => {
          if (!doc.embedding) {
            doc.embedding = await this.generateEmbedding(doc.content)
          }
          return doc
        }),
      )

      const vectors = documentsWithEmbeddings.map((doc) => ({
        id: doc.id,
        values: doc.embedding!,
        metadata: {
          content: doc.content,
          ...doc.metadata,
        },
      }))

      const response = await fetch(`${this.baseUrl}/vectors/upsert`, {
        method: "POST",
        headers: {
          "Api-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vectors,
          namespace: "content",
        }),
      })

      if (response.ok) {
        logger.info("Documents upserted to Pinecone", { count: documents.length })
        return true
      } else {
        const error = await response.text()
        logger.error("Failed to upsert documents to Pinecone", { error })
        return false
      }
    } catch (error) {
      logger.error("Pinecone upsert error", { error })
      return false
    }
  }

  async searchSimilar(query: string, topK = 5): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query)

      const response = await fetch(`${this.baseUrl}/query`, {
        method: "POST",
        headers: {
          "Api-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vector: queryEmbedding,
          topK,
          includeMetadata: true,
          namespace: "content",
        }),
      })

      if (response.ok) {
        const result = await response.json()
        return result.matches.map((match: any) => ({
          id: match.id,
          score: match.score,
          content: match.metadata.content,
          metadata: match.metadata,
        }))
      } else {
        logger.error("Pinecone search failed", { status: response.status })
        return []
      }
    } catch (error) {
      logger.error("Pinecone search error", { error })
      return []
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-ada-002",
          input: text,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        return result.data[0].embedding
      } else {
        throw new Error("Failed to generate embedding")
      }
    } catch (error) {
      logger.error("Embedding generation error", { error })
      throw error
    }
  }

  async deleteDocuments(ids: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/vectors/delete`, {
        method: "POST",
        headers: {
          "Api-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids,
          namespace: "content",
        }),
      })

      if (response.ok) {
        logger.info("Documents deleted from Pinecone", { count: ids.length })
        return true
      } else {
        logger.error("Failed to delete documents from Pinecone")
        return false
      }
    } catch (error) {
      logger.error("Pinecone delete error", { error })
      return false
    }
  }
}
