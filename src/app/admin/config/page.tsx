"use client"

import { useEffect, useState } from "react"
import { adminApi } from "@/lib/admin"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"

interface SystemConfig {
  id: number
  key: string
  value: string
  description: string | null
  category: string
  value_type: string
}

export default function ConfigManagement() {
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      const data = await adminApi.getConfigs()
      setConfigs(data.configs)
      setCategories(data.categories)
      setIsLoading(false)
    } catch (error: any) {
      console.error("Failed to load configs:", error)
      toast.error("加载配置失败")
    }
  }

  const handleSave = async () => {
    if (Object.keys(editedValues).length === 0) {
      toast.error("没有修改任何配置")
      return
    }

    setIsSaving(true)
    try {
      await adminApi.updateConfigs(editedValues)
      toast.success("配置已保存")
      setEditedValues({})
      loadConfigs()
    } catch (error: any) {
      console.error("Failed to save configs:", error)
      toast.error("保存失败")
    } finally {
      setIsSaving(false)
    }
  }

  const handleValueChange = (key: string, value: string) => {
    setEditedValues({ ...editedValues, [key]: value })
  }

  const filteredConfigs =
    selectedCategory === "all"
      ? configs
      : configs.filter((c) => c.category === selectedCategory)

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      api: "API 配置",
      model: "模型配置",
      pricing: "定价配置",
      limits: "限制配置",
      queue: "队列配置",
    }
    return labels[category] || category
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">系统配置</h2>
          <p className="text-muted-foreground">
            管理 API 端点、模型定价、系统限制等配置
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || Object.keys(editedValues).length === 0}
        >
          {isSaving ? "保存中..." : "保存修改"}
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("all")}
        >
          全部
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {getCategoryLabel(category)}
          </Button>
        ))}
      </div>

      {/* Configs List */}
      <div className="space-y-4">
        {filteredConfigs.map((config) => (
          <div
            key={config.key}
            className="rounded-lg border bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{config.key}</h3>
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    {getCategoryLabel(config.category)}
                  </span>
                </div>
                {config.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {config.description}
                  </p>
                )}
              </div>
              <div className="w-96">
                {config.key === "openai_api_key" ? (
                  <input
                    type="password"
                    value={editedValues[config.key] ?? config.value}
                    onChange={(e) =>
                      handleValueChange(config.key, e.target.value)
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                ) : config.value_type === "number" ? (
                  <input
                    type="number"
                    value={editedValues[config.key] ?? config.value}
                    onChange={(e) =>
                      handleValueChange(config.key, e.target.value)
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                ) : (
                  <input
                    type="text"
                    value={editedValues[config.key] ?? config.value}
                    onChange={(e) =>
                      handleValueChange(config.key, e.target.value)
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                )}
                {editedValues[config.key] !== undefined && (
                  <p className="mt-1 text-xs text-amber-600">
                    已修改 (原值: {config.value})
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Help Text */}
      <div className="rounded-lg border bg-amber-50 p-4">
        <h3 className="mb-2 font-semibold text-amber-900">⚠️ 注意事项</h3>
        <ul className="space-y-1 text-sm text-amber-800">
          <li>• 修改 API Key 后，新的视频生成任务将使用新的 Key</li>
          <li>• 修改定价配置后，新创建的视频将使用新的积分消耗标准</li>
          <li>• 修改队列配置需要重启 API 服务才能生效</li>
          <li>• 请谨慎修改配置，错误的配置可能导致系统无法正常工作</li>
        </ul>
      </div>
    </div>
  )
}
