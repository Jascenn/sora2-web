'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X, Star, Zap, Crown, Rocket } from 'lucide-react'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<string>('pro')

  const plans = [
    {
      id: 'starter',
      name: '入门版',
      icon: Rocket,
      price: { monthly: 29, yearly: 290 },
      credits: 300,
      features: [
        { name: '每月300积分', included: true },
        { name: '标准画质生成', included: true },
        { name: '最长30秒视频', included: true },
        { name: '基础模板库', included: true },
        { name: '商业许可', included: true },
        { name: '优先处理队列', included: false },
        { name: '高级模板库', included: false },
        { name: '4K超高清', included: false },
        { name: 'API接入', included: false },
      ],
      color: 'border-gray-200',
      badge: null,
    },
    {
      id: 'pro',
      name: '专业版',
      icon: Zap,
      price: { monthly: 99, yearly: 990 },
      credits: 1200,
      features: [
        { name: '每月1200积分', included: true },
        { name: '高清画质生成', included: true },
        { name: '最长60秒视频', included: true },
        { name: '完整模板库', included: true },
        { name: '商业许可', included: true },
        { name: '优先处理队列', included: true },
        { name: '高级编辑功能', included: true },
        { name: '去除水印', included: true },
        { name: 'API接入', included: false },
        { name: '专属客服', included: false },
      ],
      color: 'border-blue-500',
      badge: { text: '最受欢迎', color: 'bg-blue-100 text-blue-800' },
    },
    {
      id: 'enterprise',
      name: '企业版',
      icon: Crown,
      price: { monthly: 399, yearly: 3990 },
      credits: 6000,
      features: [
        { name: '每月6000积分', included: true },
        { name: '4K超高清生成', included: true },
        { name: '最长120秒视频', included: true },
        { name: '无限模板使用', included: true },
        { name: '完整商业许可', included: true },
        { name: '极速处理队列', included: true },
        { name: '专属定制模板', included: true },
        { name: '批量生成', included: true },
        { name: '完整API接入', included: true },
        { name: '专属客户经理', included: true },
        { name: 'SLA保障', included: true },
      ],
      color: 'border-purple-500',
      badge: { text: '推荐企业', color: 'bg-purple-100 text-purple-800' },
    },
  ]

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    // Here you would typically navigate to checkout
    console.log(`Selected plan: ${planId}, Billing: ${billingCycle}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">选择适合您的套餐</h1>
          <p className="text-xl text-gray-600 mb-8">
            无论您是个人创作者还是企业团队，我们都有适合您的方案
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              按月付费
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              按年付费
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                省20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon
            const price = plan.price[billingCycle]
            const monthlyPrice = billingCycle === 'yearly' ? price / 12 : price

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  selectedPlan === plan.id
                    ? 'ring-2 ring-blue-500 shadow-lg transform scale-105'
                    : ''
                } ${plan.color}`}
              >
                {plan.badge && (
                  <div className={`absolute top-4 right-4 ${plan.badge.color} text-xs px-3 py-1 rounded-full font-medium`}>
                    {plan.badge.text}
                  </div>
                )}

                <CardHeader className="text-center pb-6">
                  <div className="flex justify-center mb-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      plan.id === 'pro' ? 'bg-blue-100 text-blue-600' :
                      plan.id === 'enterprise' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <Icon className="w-8 h-8" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">¥{monthlyPrice.toFixed(0)}</span>
                      <span className="text-gray-600 ml-2">/月</span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-sm text-green-600 mt-2">
                        年付¥{price}，节省¥{(plan.price.monthly * 12 - price)}
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <span className="text-lg font-semibold text-blue-600">
                      {plan.credits.toLocaleString()} 积分/月
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`w-full py-3 font-medium ${
                      plan.id === 'pro'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : plan.id === 'enterprise'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                    variant={plan.id === 'starter' ? 'outline' : 'default'}
                  >
                    {selectedPlan === plan.id ? '已选择' : '选择此套餐'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">常见问题</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">积分如何使用？</h3>
                <p className="text-gray-600 text-sm">
                  每生成一个视频会消耗不同数量的积分，取决于视频长度和画质设置。
                  标准清晰度30秒视频消耗50积分，高清版本消耗100积分。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">可以随时升级套餐吗？</h3>
                <p className="text-gray-600 text-sm">
                  当然可以！您可以随时升级到更高等级的套餐，积分会按比例增加。
                  降级会在下个计费周期生效。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">积分会过期吗？</h3>
                <p className="text-gray-600 text-sm">
                  每月积分会在月底过期，建议及时使用。企业版用户可以申请积分累积服务。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">支持哪些支付方式？</h3>
                <p className="text-gray-600 text-sm">
                  我们支持支付宝、微信支付、银行卡等多种支付方式。
                  企业用户还可以申请发票和对公转账。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-blue-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">需要定制化方案？</h2>
          <p className="text-xl mb-8 opacity-90">
            如果您有特殊需求或需要大规模使用，我们的团队可以为您量身定制
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            联系销售团队
          </Button>
        </div>
      </div>
    </div>
  )
}