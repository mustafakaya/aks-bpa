import { useQuery } from '@tanstack/react-query'
import { Card, Spinner } from '@fluentui/react-components'
import { Open24Regular } from '@fluentui/react-icons'
import { listPillars, listRecommendations } from '../services/api'
import { useState } from 'react'
import { PILLAR_COLORS } from '../types'

export default function RecommendationsPage() {
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null)

  const { data: pillars, isLoading: loadingPillars } = useQuery({
    queryKey: ['pillars'],
    queryFn: listPillars,
  })

  const { data: recommendations, isLoading: loadingRecs } = useQuery({
    queryKey: ['recommendations', selectedPillar],
    queryFn: () => listRecommendations(selectedPillar || undefined),
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Recommendations</h1>
        <p className="text-gray-500 mt-1">
          Explore all best practice recommendations based on Azure Well-Architected Framework
        </p>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {loadingPillars ? (
          <Spinner />
        ) : (
          pillars?.map((pillar) => (
            <Card
              key={pillar.id}
              className={`p-4 cursor-pointer transition-all ${
                selectedPillar === pillar.name
                  ? 'ring-2 ring-blue-500'
                  : 'hover:shadow-md'
              }`}
              onClick={() =>
                setSelectedPillar(selectedPillar === pillar.name ? null : pillar.name)
              }
            >
              <div className="text-center">
                <span className="text-3xl">{pillar.icon}</span>
                <h3 className="font-semibold mt-2" style={{ color: pillar.color }}>
                  {pillar.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{pillar.description}</p>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Recommendations List */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            {selectedPillar ? `${selectedPillar} Recommendations` : 'All Recommendations'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {recommendations?.length || 0} recommendation{recommendations?.length !== 1 ? 's' : ''}
          </p>
        </div>

        {loadingRecs ? (
          <div className="p-8 flex justify-center">
            <Spinner size="large" />
          </div>
        ) : (
          <div className="divide-y">
            {recommendations?.map((rec) => (
              <div key={rec.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${PILLAR_COLORS[rec.category]}20`,
                          color: PILLAR_COLORS[rec.category],
                        }}
                      >
                        {rec.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {rec.check_type === 'kql_query' ? '📊 ARG Query' : '🔍 Property Check'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800">{rec.recommendation_name}</h3>
                    {rec.description && (
                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    )}
                    {rec.remediation && (
                      <p className="text-sm text-blue-600 mt-2">
                        💡 <strong>Remediation:</strong> {rec.remediation}
                      </p>
                    )}
                  </div>
                  {rec.learn_more_link && (
                    <a
                      href={rec.learn_more_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1 ml-4"
                    >
                      <Open24Regular className="w-4 h-4" />
                      Learn More
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
